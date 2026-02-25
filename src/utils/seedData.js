import { generateId } from './ids';

/**
 * FOH Basic Tasks — pre-loaded on first run
 */
export function createFOHDocument() {
  const docId = generateId();

  const groups = [
    {
      title: 'Bookings & Initial Contact',
      processes: [
        'Take bookings and actively listen to what the customer wants.',
        'Ask questions to clarify the issue if it\'s not clear. What, Why, Where, When?',
        'Add a clear comment to the job sheet and send the relevant questionnaire.',
        'Capture full customer details: name, phone number, email, and address, or send the contact details questionnaire. Emails can be tricky over the phone.',
        'If there is any doubt about whether we want to look at a fault, create a jobsheet and ask for the diagnostic questionnaire to be filled out for review by Mark or a Tech.',
        'Use the technical query slider for any technical query including pending bookings on issues. This will give Mark a red tile for review',
        'Confirm within 24 hours of receiving the returned questionnaire whether we can help.',
        'Regular customers with an urgent issue (drivability issue) should be prioritised, if there\'s no space say you will ask the workshop if it can be squeezed in sooner and get back to them.',
      ],
    },
    {
      title: 'Estimates & Scheduling',
      processes: [
        'If it is busy or cars on site need estimates urgently, prioritise the onsite vehicles and go back to other estimates when we have time',
        'Create estimates and send online authorisation so customers know costs in advance. Do this for worked booked in as well as enquiries.',
        'It is not acceptable for customers to be unaware of cost at drop-off for work to be done.',
        'Making estimates means we are recording quoted prices and options clearly for future reference. Don\'t use jobsheets to quote or we lose all the information when we delete it from the jobsheet if not approved.',
        'Allocate schedule times accurately using Statistics in jobsheet and manual time entry on schedule allocation rather than dragging a rough guess for time.',
      ],
    },
    {
      title: 'Customer Arrival & Drop-Off',
      processes: [
        'Greet customers and reconfirm the work required.',
        'Confirm costs if not already approved.',
        'Confirm email and phone number are correct for all job-related communication including VHCs, updates, invoices, and any other information.',
        'Ensure questionnaires are complete if not go through it with the customer and add comments for any required information.',
        'If a customer asks \'can you check X?\' and it is not part of the standard process, add a group and a labour VHC line (minimum 0.1 hrs) so it can be completed and commented on by the technician and not forgotten about. You also don\'t have to ask if that was done.',
      ],
    },
    {
      title: 'Monitoring, VIs & Workflow',
      processes: [
        'Monitor the dashboard throughout the day – red tiles mean action is required.',
        'Review completed VIs promptly.',
        'Price additional work reported by technicians.',
        'Assess whether work can be completed the same day.',
        'Order returnable parts asap where approval is likely/possible that day. Parts can always be returned but we cant resell lost hours if the parts are not here in time for an idle tech.',
        'Add accurate time allocations to the schedule when work is approved.',
        'Email VIs and estimates the same day even if work is being rescheduled.',
        'Do not approve any work until all red and amber QC items are explained or priced.',
      ],
    },
    {
      title: 'Reminders & Vehicle History',
      processes: [
        'Update MOT, service, timing belt, and brake fluid reminders on every job. If the vehicle has a timing chain set the due date to x/x/2099 so we don\'t have to keep looking it up.',
        'If service history is unclear, ask the customer for clarification of history.',
        'If items are overdue, record the due date if known or today\'s date if unsure to highlight the day we made them aware',
        'Accurate reminders prevent repeatedly asking the same questions, for example, if the timing belt has been done.',
      ],
    },
    {
      title: 'Squeeze-In & Forward Scheduling',
      processes: [
        'If a car is being squeezed in, add the required time to the next available slot in the diary',
        'If work is scheduled later than today also add a slot in work in progress on the current day so the workshop is aware the car is here and can be started if we get the chance.',
        'At the end of the day, drag unfinished allocations into the next day by putting them off the end of the schedule and they will move over to the next working day',
      ],
    },
    {
      title: 'Job Completion & Collection',
      processes: [
        'Check complete jobs for any red flags or incomplete work. If you sort red flags now there will be no panic when invoicing the job and the customer is in front of you.',
        'If current allocation is complete but there is another allocation for further work make sure the allocation is in the schedule and put into pending to remove from complete.',
        'If the job is completely finished, call the customer to update and ask if they have any further questions or need anything else, add a comment in the info section with \'collecting 5pm etc\' and change status to ready.',
        'Use payment links where appropriate to speed up collection process if the customer would like to use them.',
      ],
    },
    {
      title: 'Estimates Without Vehicles On Site',
      processes: [
        'Estimates must still be completed.',
        'Prioritise vehicles on site first.',
        'Create the estimate during the call and leave it pending.',
        'Mark estimates as complete if no follow-up is required.',
      ],
    },
    {
      title: 'Parts & Orders',
      processes: [
        'Pre-order parts for booked jobs a minimum of 3 days in advance, ideally a week.',
        'Be aware of long lead-time parts and make sure we are going to have them a few days in advance of booking dates.',
        'Take deposits for non-returnable parts when vehicles are not on site.',
        'Create orders at the time parts are ordered.',
        'Create return orders before parts are collected and mark as shipped only once collected.',
        'Check outstanding deliveries, returns, credits, and surcharges regularly, chase where needed.',
      ],
    },
    {
      title: 'Forward Planning (2 Days Ahead)',
      processes: [
        'Check jobs scheduled two days in advance.',
        'Ensure all jobs are pre authorized by the customer and call if they have only opened them.',
        'Ensure all relevant questionnaires are completed.',
        'If not completed Call (preferred option) and go through the questions or resend questionnaires if not yet complete and customer unavailable',
        'Confirm all parts are in for upcoming jobs.',
      ],
    },
    {
      title: 'End of Day Tasks',
      processes: [
        'Check vehicles on site and post any missed jobs.',
        'Ensure all customers have been contacted, even if only to advise an update will follow.',
        'Clear the schedule and review all red tiles.',
        'Run end of day and correct any inaccuracies.',
      ],
    },
    {
      title: 'End of Week Tasks',
      processes: [
        'Collect cash and cheques.',
        'Separate by denominations.',
        'Record total cash, total cheques, and overall total on the envelope. Put it in the safe.',
      ],
    },
    {
      title: 'End of Month Tasks',
      processes: [
        'Post internal invoices within the correct month.',
        'Ensure all bank payments are posted before statements generate.',
      ],
    },
  ];

  const doc = {
    id: docId,
    title: 'FOH Basic Tasks',
    createdAt: new Date().toISOString(),
    groups: groups.map((g, gi) => ({
      id: generateId(),
      title: g.title,
      order: gi,
      processes: g.processes.map((p, pi) => ({
        id: generateId(),
        description: p,
        order: pi,
      })),
    })),
  };

  return doc;
}

/**
 * Parse bulk text into groups and processes.
 * Lines without bullet prefix = group headers
 * Lines with bullet (•, ·, -, *) prefix = processes under preceding group
 */
export function parseBulkText(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  const groups = [];
  let currentGroup = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // Check if it's a bullet point (process)
    const bulletMatch = trimmed.match(/^[\u2022\u00B7\-\*]\s*(.+)/);
    if (bulletMatch) {
      if (!currentGroup) {
        // Create a default group if processes come before any header
        currentGroup = { title: 'Untitled Group', processes: [] };
        groups.push(currentGroup);
      }
      currentGroup.processes.push(bulletMatch[1].trim());
    } else if (trimmed) {
      // It's a group header
      currentGroup = { title: trimmed, processes: [] };
      groups.push(currentGroup);
    }
  }

  return groups;
}
