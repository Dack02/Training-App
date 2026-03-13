# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Process Training Tracker for Apex Auto Tech — a client-side SPA that tracks employee training progress on business processes with manager review and sign-off capabilities. All data is persisted in browser localStorage (no backend).

## Commands

```bash
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # Production build → dist/
npm run lint       # ESLint (flat config, ESLint 9.x)
npm run preview    # Preview production build locally
```

No test framework is configured.

## Tech Stack

- **React 19** (JavaScript/JSX, no TypeScript)
- **Vite 7** with `@vitejs/plugin-react`
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (theme defined in `src/index.css` `@theme` block)
- **lucide-react** for icons
- No component library, external state management, or router

## Architecture

### Routing

Custom view-based routing in `App.jsx` — a `currentView` state string selects the active component. Views: `dashboard`, `documents`, `review`, `progress-report`, `manage-documents`, `manage-users`, `settings`. No React Router.

### State & Persistence

- All state lives in React `useState`/`useEffect` hooks in `App.jsx` and is passed down as props.
- `src/utils/storage.js` wraps localStorage with JSON serialization, retry logic, and two key prefixes:
  - `ptt:` — shared data (users, documents, progress, sign-offs, attachments)
  - `ptt-personal:` — per-browser data (current user)
- Context API is used only for the Toast notification system (`src/components/Toast.jsx`).

### Storage Key Conventions

```
ptt:users                              # User list
ptt:documents                          # Document metadata list
ptt:doc:{docId}                        # Full document (groups + processes)
ptt:progress:{docId}:{userId}          # User's grades/notes per process
ptt:signoffs:{docId}:{userId}          # Manager sign-off records (append-only log)
ptt:attachments:{docId}:{processId}    # File attachments (base64)
ptt-personal:current-user              # Logged-in user ID
```

### Data Model

Documents have a hierarchical structure: **Document → Groups → Processes**. Each process can have guidance bullet points ("What Good Looks Like") and file attachments.

### Grading System (src/utils/grades.js)

Five levels with associated Tailwind color classes defined in the `GRADES` array:
- **Not Started** (gray) → **Learning** (amber) → **Practicing** (blue) → **Confident** (green) → **Mastered** (purple)
- "Completed" for progress calculations means Confident or Mastered (`isCompleted()`).
- Custom theme colors are defined in `src/index.css` under `@theme` (e.g., `--color-grade-learning`).

### User Roles

Two roles: **trainee** (self-assess, add notes) and **manager** (all trainee features + document/user management, sign-off authority). No authentication — users are selected/created from a login screen.

### Sign-off System

Sign-offs are an append-only log. Revocations mark existing entries with a timestamp and reason. The active sign-off for a process is the latest non-revoked entry.

### Seed Data

On first run, a "FOH Basic Tasks" document is created via `src/utils/seedData.js`. This file also contains the bulk import parser (text lines → groups, bullet points → processes).
