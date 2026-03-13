-- ============================================================
-- Seed: FOH Basic Tasks document
-- Run this once in the Supabase SQL Editor after creating the schema.
-- ============================================================

do $$
declare
  doc_id uuid := gen_random_uuid();
  g_id uuid;
begin
  -- Create the document
  insert into documents (id, title) values (doc_id, 'FOH Basic Tasks');

  -- 1. Bookings & Initial Contact
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Bookings & Initial Contact', 0);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Take bookings and actively listen to what the customer wants.', 0),
    (g_id, doc_id, 'Ask questions to clarify the issue if it''s not clear. What, Why, Where, When?', 1),
    (g_id, doc_id, 'Add a clear comment to the job sheet and send the relevant questionnaire.', 2),
    (g_id, doc_id, 'Capture full customer details: name, phone number, email, and address, or send the contact details questionnaire. Emails can be tricky over the phone.', 3),
    (g_id, doc_id, 'If there is any doubt about whether we want to look at a fault, create a jobsheet and ask for the diagnostic questionnaire to be filled out for review by Mark or a Tech.', 4),
    (g_id, doc_id, 'Use the technical query slider for any technical query including pending bookings on issues. This will give Mark a red tile for review', 5),
    (g_id, doc_id, 'Confirm within 24 hours of receiving the returned questionnaire whether we can help.', 6),
    (g_id, doc_id, 'Regular customers with an urgent issue (drivability issue) should be prioritised, if there''s no space say you will ask the workshop if it can be squeezed in sooner and get back to them.', 7);

  -- 2. Estimates & Scheduling
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Estimates & Scheduling', 1);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'If it is busy or cars on site need estimates urgently, prioritise the onsite vehicles and go back to other estimates when we have time', 0),
    (g_id, doc_id, 'Create estimates and send online authorisation so customers know costs in advance. Do this for worked booked in as well as enquiries.', 1),
    (g_id, doc_id, 'It is not acceptable for customers to be unaware of cost at drop-off for work to be done.', 2),
    (g_id, doc_id, 'Making estimates means we are recording quoted prices and options clearly for future reference. Don''t use jobsheets to quote or we lose all the information when we delete it from the jobsheet if not approved.', 3),
    (g_id, doc_id, 'Allocate schedule times accurately using Statistics in jobsheet and manual time entry on schedule allocation rather than dragging a rough guess for time.', 4);

  -- 3. Customer Arrival & Drop-Off
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Customer Arrival & Drop-Off', 2);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Greet customers and reconfirm the work required.', 0),
    (g_id, doc_id, 'Confirm costs if not already approved.', 1),
    (g_id, doc_id, 'Confirm email and phone number are correct for all job-related communication including VHCs, updates, invoices, and any other information.', 2),
    (g_id, doc_id, 'Ensure questionnaires are complete if not go through it with the customer and add comments for any required information.', 3),
    (g_id, doc_id, 'If a customer asks ''can you check X?'' and it is not part of the standard process, add a group and a labour VHC line (minimum 0.1 hrs) so it can be completed and commented on by the technician and not forgotten about. You also don''t have to ask if that was done.', 4);

  -- 4. Monitoring, VIs & Workflow
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Monitoring, VIs & Workflow', 3);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Monitor the dashboard throughout the day – red tiles mean action is required.', 0),
    (g_id, doc_id, 'Review completed VIs promptly.', 1),
    (g_id, doc_id, 'Price additional work reported by technicians.', 2),
    (g_id, doc_id, 'Assess whether work can be completed the same day.', 3),
    (g_id, doc_id, 'Order returnable parts asap where approval is likely/possible that day. Parts can always be returned but we cant resell lost hours if the parts are not here in time for an idle tech.', 4),
    (g_id, doc_id, 'Add accurate time allocations to the schedule when work is approved.', 5),
    (g_id, doc_id, 'Email VIs and estimates the same day even if work is being rescheduled.', 6),
    (g_id, doc_id, 'Do not approve any work until all red and amber QC items are explained or priced.', 7);

  -- 5. Reminders & Vehicle History
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Reminders & Vehicle History', 4);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Update MOT, service, timing belt, and brake fluid reminders on every job. If the vehicle has a timing chain set the due date to x/x/2099 so we don''t have to keep looking it up.', 0),
    (g_id, doc_id, 'If service history is unclear, ask the customer for clarification of history.', 1),
    (g_id, doc_id, 'If items are overdue, record the due date if known or today''s date if unsure to highlight the day we made them aware', 2),
    (g_id, doc_id, 'Accurate reminders prevent repeatedly asking the same questions, for example, if the timing belt has been done.', 3);

  -- 6. Squeeze-In & Forward Scheduling
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Squeeze-In & Forward Scheduling', 5);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'If a car is being squeezed in, add the required time to the next available slot in the diary', 0),
    (g_id, doc_id, 'If work is scheduled later than today also add a slot in work in progress on the current day so the workshop is aware the car is here and can be started if we get the chance.', 1),
    (g_id, doc_id, 'At the end of the day, drag unfinished allocations into the next day by putting them off the end of the schedule and they will move over to the next working day', 2);

  -- 7. Job Completion & Collection
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Job Completion & Collection', 6);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Check complete jobs for any red flags or incomplete work. If you sort red flags now there will be no panic when invoicing the job and the customer is in front of you.', 0),
    (g_id, doc_id, 'If current allocation is complete but there is another allocation for further work make sure the allocation is in the schedule and put into pending to remove from complete.', 1),
    (g_id, doc_id, 'If the job is completely finished, call the customer to update and ask if they have any further questions or need anything else, add a comment in the info section with ''collecting 5pm etc'' and change status to ready.', 2),
    (g_id, doc_id, 'Use payment links where appropriate to speed up collection process if the customer would like to use them.', 3);

  -- 8. Estimates Without Vehicles On Site
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Estimates Without Vehicles On Site', 7);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Estimates must still be completed.', 0),
    (g_id, doc_id, 'Prioritise vehicles on site first.', 1),
    (g_id, doc_id, 'Create the estimate during the call and leave it pending.', 2),
    (g_id, doc_id, 'Mark estimates as complete if no follow-up is required.', 3);

  -- 9. Parts & Orders
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Parts & Orders', 8);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Pre-order parts for booked jobs a minimum of 3 days in advance, ideally a week.', 0),
    (g_id, doc_id, 'Be aware of long lead-time parts and make sure we are going to have them a few days in advance of booking dates.', 1),
    (g_id, doc_id, 'Take deposits for non-returnable parts when vehicles are not on site.', 2),
    (g_id, doc_id, 'Create orders at the time parts are ordered.', 3),
    (g_id, doc_id, 'Create return orders before parts are collected and mark as shipped only once collected.', 4),
    (g_id, doc_id, 'Check outstanding deliveries, returns, credits, and surcharges regularly, chase where needed.', 5);

  -- 10. Forward Planning (2 Days Ahead)
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'Forward Planning (2 Days Ahead)', 9);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Check jobs scheduled two days in advance.', 0),
    (g_id, doc_id, 'Ensure all jobs are pre authorized by the customer and call if they have only opened them.', 1),
    (g_id, doc_id, 'Ensure all relevant questionnaires are completed.', 2),
    (g_id, doc_id, 'If not completed Call (preferred option) and go through the questions or resend questionnaires if not yet complete and customer unavailable', 3),
    (g_id, doc_id, 'Confirm all parts are in for upcoming jobs.', 4);

  -- 11. End of Day Tasks
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'End of Day Tasks', 10);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Check vehicles on site and post any missed jobs.', 0),
    (g_id, doc_id, 'Ensure all customers have been contacted, even if only to advise an update will follow.', 1),
    (g_id, doc_id, 'Clear the schedule and review all red tiles.', 2),
    (g_id, doc_id, 'Run end of day and correct any inaccuracies.', 3);

  -- 12. End of Week Tasks
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'End of Week Tasks', 11);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Collect cash and cheques.', 0),
    (g_id, doc_id, 'Separate by denominations.', 1),
    (g_id, doc_id, 'Record total cash, total cheques, and overall total on the envelope. Put it in the safe.', 2);

  -- 13. End of Month Tasks
  g_id := gen_random_uuid();
  insert into process_groups (id, document_id, title, sort_order) values (g_id, doc_id, 'End of Month Tasks', 12);
  insert into processes (group_id, document_id, description, sort_order) values
    (g_id, doc_id, 'Post internal invoices within the correct month.', 0),
    (g_id, doc_id, 'Ensure all bank payments are posted before statements generate.', 1);

end $$;
