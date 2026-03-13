-- ============================================================
-- Process Training Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables,
-- triggers, and RLS policies.
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'trainee' check (role in ('trainee', 'manager')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Unknown'),
    coalesce(new.raw_user_meta_data->>'role', 'trainee')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. Documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 3. Process Groups
create table if not exists process_groups (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 4. Processes
create table if not exists processes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references process_groups(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  description text not null,
  sort_order int not null default 0,
  bullet_points text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 5. Progress (trainee self-assessment)
create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references processes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  grade text not null default 'not_started' check (grade in ('not_started', 'learning', 'practicing', 'confident', 'mastered')),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  unique (process_id, user_id)
);

-- 6. Signoffs (manager sign-off records)
create table if not exists signoffs (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references processes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  manager_id uuid not null references profiles(id),
  signed_off_at timestamptz not null default now(),
  comment text,
  revoked_at timestamptz,
  revoke_reason text
);

-- 7. Attachments (file metadata; actual files in Supabase Storage)
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references processes(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes int,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_process_groups_doc on process_groups(document_id);
create index if not exists idx_processes_group on processes(group_id);
create index if not exists idx_processes_doc on processes(document_id);
create index if not exists idx_progress_user_doc on progress(user_id, document_id);
create index if not exists idx_progress_process on progress(process_id);
create index if not exists idx_signoffs_user_doc on signoffs(user_id, document_id);
create index if not exists idx_signoffs_process on signoffs(process_id);
create index if not exists idx_attachments_process on attachments(process_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table documents enable row level security;
alter table process_groups enable row level security;
alter table processes enable row level security;
alter table progress enable row level security;
alter table signoffs enable row level security;
alter table attachments enable row level security;

-- Helper: check if the current user is a manager
create or replace function is_manager()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'manager'
  );
$$ language sql security definer stable;

-- Profiles: everyone reads, users update own row, managers update any
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update_own" on profiles for update to authenticated using (id = auth.uid());
create policy "profiles_update_manager" on profiles for update to authenticated using (is_manager());

-- Documents: everyone reads, managers write
create policy "documents_select" on documents for select to authenticated using (true);
create policy "documents_insert" on documents for insert to authenticated with check (is_manager());
create policy "documents_update" on documents for update to authenticated using (is_manager());
create policy "documents_delete" on documents for delete to authenticated using (is_manager());

-- Process Groups: everyone reads, managers write
create policy "groups_select" on process_groups for select to authenticated using (true);
create policy "groups_insert" on process_groups for insert to authenticated with check (is_manager());
create policy "groups_update" on process_groups for update to authenticated using (is_manager());
create policy "groups_delete" on process_groups for delete to authenticated using (is_manager());

-- Processes: everyone reads, managers write
create policy "processes_select" on processes for select to authenticated using (true);
create policy "processes_insert" on processes for insert to authenticated with check (is_manager());
create policy "processes_update" on processes for update to authenticated using (is_manager());
create policy "processes_delete" on processes for delete to authenticated using (is_manager());

-- Progress: everyone reads, users write own rows only
create policy "progress_select" on progress for select to authenticated using (true);
create policy "progress_insert" on progress for insert to authenticated with check (user_id = auth.uid());
create policy "progress_update" on progress for update to authenticated using (user_id = auth.uid());
create policy "progress_delete" on progress for delete to authenticated using (user_id = auth.uid());

-- Signoffs: everyone reads, managers write
create policy "signoffs_select" on signoffs for select to authenticated using (true);
create policy "signoffs_insert" on signoffs for insert to authenticated with check (is_manager());
create policy "signoffs_update" on signoffs for update to authenticated using (is_manager());

-- Attachments: everyone reads, managers write
create policy "attachments_select" on attachments for select to authenticated using (true);
create policy "attachments_insert" on attachments for insert to authenticated with check (is_manager());
create policy "attachments_delete" on attachments for delete to authenticated using (is_manager());

-- ============================================================
-- Storage Bucket
-- ============================================================
-- Run this separately or via the Supabase dashboard:
-- insert into storage.buckets (id, name, public)
-- values ('attachments', 'attachments', false);
--
-- Storage policies:
-- create policy "auth_read" on storage.objects for select to authenticated using (bucket_id = 'attachments');
-- create policy "manager_upload" on storage.objects for insert to authenticated with check (bucket_id = 'attachments' and (select is_manager()));
-- create policy "manager_delete" on storage.objects for delete to authenticated using (bucket_id = 'attachments' and (select is_manager()));
