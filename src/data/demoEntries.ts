import { SavedEntry } from '@/types/dashboard';

const now = new Date('2026-05-17T12:00:00Z');

export const demoEntries: SavedEntry[] = [
  {
    id: 'demo-insurance-policy',
    title: 'Insurance renewal reminder',
    category: 'Finance',
    fields: {
      category: 'Finance',
      provider: 'State Farm',
      policy_number: 'SF-1234',
      renewal_date: '2026-06-12',
      premium: '240',
      reminder: 'Remind me two weeks before renewal',
    },
    fieldDefinitions: [],
    tags: ['insurance', 'renewal', 'reminder'],
    summary: 'Policy renews June 12 with a $240 premium.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'demo-medication-schedule',
    title: "Mom's medication schedule",
    category: 'Health',
    fields: {
      category: 'Health',
      medication: 'Lisinopril',
      dosage: '10mg',
      schedule: 'Every morning after breakfast',
      pharmacy_phone: '7045550147',
    },
    fieldDefinitions: [],
    tags: ['health', 'family', 'medication'],
    summary: 'Daily medication reminder with pharmacy contact.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'demo-client-follow-up',
    title: 'Client follow-up after demo',
    category: 'Contacts',
    fields: {
      category: 'Contacts',
      contact_name: 'Alicia Grant',
      company: 'Grant Family Dental',
      next_step: 'Send proposal and book 15-minute call',
      due_date: '2026-05-20',
      email: 'alicia@example.com',
    },
    fieldDefinitions: [],
    tags: ['client', 'proposal', 'follow-up'],
    summary: 'Follow up with proposal after product demo.',
    createdAt: now,
    updatedAt: now,
  },
];
