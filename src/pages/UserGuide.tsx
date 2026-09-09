import {useState, type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {Brain, ChevronRight, FileText, FolderOpen, Mic, Search, Settings, Wallet} from 'lucide-react';
import {WorkspacePage, WorkspacePageHeader} from '@/components/workspace/WorkspacePage';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';

const topics = [
  {
    id: 'getting-started', title: 'Getting started', icon: FolderOpen,
    paragraphs: [
      'SaveMe keeps your notes, documents, and useful details together. Start with a thought you want to remember.',
      'Open Voice capture to talk to Nova, or choose New memory to type a title and notes. Your saved items appear in All entries and in their collection.',
    ],
    links: [{label: 'Open dashboard', to: '/dashboard'}, {label: 'Take the guided tour', to: '/onboarding'}],
  },
  {
    id: 'voice', title: 'Talking to Nova', icon: Mic,
    paragraphs: [
      'Tap the microphone in Voice capture or the floating Nova control, then allow microphone access. Nova uses realtime voice to listen and respond.',
      'Try “Remember that my appointment is on Friday” or “Go to the dashboard.” The same conversation stays available as you move between pages inside the app.',
      'Use End session when you are finished speaking. In Settings → Voice, choose whether Nova keeps listening after a response. Refreshing or closing the browser ends the live connection.',
    ],
    links: [{label: 'Open Voice capture', to: '/voice-capture'}, {label: 'Voice settings', to: '/settings?tab=voice'}],
  },
  {
    id: 'brain-dump', title: 'Organizing a brain dump', icon: Brain,
    paragraphs: [
      'Use Brain dump when you have several thoughts to sort through. Start a voice conversation or type into Your draft.',
      'Choose Organize to turn your draft into structured details. Check the result in Review & save, make any changes, and save when it is ready.',
      'New conversation clears the current draft and conversation so you can start again.',
    ],
    links: [{label: 'Open Brain dump', to: '/brain-dump'}],
  },
  {
    id: 'memories', title: 'Adding and editing memories', icon: FileText,
    paragraphs: [
      'Choose Add memory in a collection, or New memory from the dashboard. Give the memory a title and add notes. Starting inside a collection selects that collection for you.',
      'Use Additional details for information such as a phone number, date, or amount. Each custom field has a name, a type, and a value.',
      'Open an entry’s actions menu to edit it, fill in its fields, or use it as a template for another entry. Editing updates the existing entry; a template creates a new one.',
    ],
    links: [{label: 'Add a memory', to: '/dashboard?action=create'}],
  },
  {
    id: 'collections', title: 'Collections and search', icon: FolderOpen,
    paragraphs: [
      'Each entry belongs to one collection: Documents, Health, Contacts, Finance, or Personal. You can change its collection when editing.',
      'All entries brings your memories together. Search by title or content and change the sort order to find what you need. Clear the search to see the full list again.',
      'Select entries to export or delete them together. Deletion asks for confirmation. Check the selected entries before confirming.',
    ],
    links: [{label: 'Browse all entries', to: '/all-entries'}],
  },
  {
    id: 'documents', title: 'Uploading and writing documents', icon: FileText,
    paragraphs: [
      'In Documents, choose Add document. Use Upload file for an existing file, Write a document to create one, or Details only to keep information about a document.',
      'For a new document, choose a format, write your content, and create the file. Then choose Save document to store it. If you change the content or format, create the file again before saving.',
      'You can add a description, tags, a date, or a storage location. If an upload fails, your form stays open so you can try again.',
    ],
    links: [{label: 'Open Documents', to: '/category/Documents'}],
  },
  {
    id: 'settings', title: 'Settings and your data', icon: Settings,
    paragraphs: [
      'Settings contains your profile, security, notifications, appearance, voice preferences, Nova memory, agent connections, billing, data controls, and support.',
      'On a phone, use the Settings section selector to move between these areas. Appearance lets you choose light, dark, or your system theme.',
      'Your data contains export and account controls. Help & support lets you contact the SaveMe team if something is not working.',
    ],
    links: [{label: 'Open Settings', to: '/settings'}],
  },
  {
    id: 'billing', title: 'Plans and billing', icon: Wallet,
    paragraphs: [
      'Plan & billing shows your current plan and the available options. Paid plans use Stripe Checkout.',
      'Use the billing portal to manage or cancel an existing paid subscription and view invoices. Review the price and billing terms before completing checkout.',
    ],
    links: [{label: 'Subscription', to: '/subscription'}],
  },
  {
    id: 'troubleshooting', title: 'When something is not working', icon: Settings,
    paragraphs: [
      'If Nova cannot hear you, check the site’s microphone permission and your selected input device. Confirm that your internet connection is available, then retry the session.',
      'If a save fails, keep the form open and retry after checking your connection. Look for the saved entry before submitting it again.',
      'If you need more help, open Help & support in Settings and describe the page, the action you took, and the message you saw.',
    ],
    links: [{label: 'Get help', to: '/settings?tab=help'}],
  },
];

const PublicGuidePage = ({children}: {children: ReactNode}) => <div className="workspace-shell mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</div>;

export default function UserGuide() {
  const {user} = useAuth();
  const GuideLayout = user ? WorkspacePage : PublicGuidePage;
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState(['getting-started']);
  const query = search.trim().toLowerCase();
  const filtered = topics.filter(topic => [topic.title, ...topic.paragraphs].join(' ').toLowerCase().includes(query));
  const toggle = (id: string) => setOpenSections(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return <GuideLayout>
    <WorkspacePageHeader title="Help & guide" description="Find your way around SaveMe, from your first memory to your daily routine."
      actions={!user && <Button asChild variant="outline"><Link to="/">Back to SaveMe</Link></Button>} />
    <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border/70 bg-card p-4 lg:sticky lg:top-24">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Search guide" placeholder="Search guide…" value={search} onChange={event => setSearch(event.target.value)} className="min-h-11 pl-9" />
        </div>
        <nav aria-label="Guide topics" className="mt-4 hidden space-y-1 lg:block">
          {filtered.map(topic => <a key={topic.id} href={`#guide-${topic.id}`} onClick={() => setOpenSections(current => current.includes(topic.id) ? current : [...current, topic.id])}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <topic.icon className="h-4 w-4 shrink-0" />{topic.title}
          </a>)}
        </nav>
      </aside>
      <div className="min-w-0 space-y-3">
        {filtered.length === 0 && <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          <p>No guide topics match “{search}”. Try another word.</p>
          <Button variant="outline" className="mt-4" onClick={() => setSearch('')}>Clear search</Button>
        </div>}
        {filtered.map(topic => <Collapsible key={topic.id} id={`guide-${topic.id}`} open={Boolean(query) || openSections.includes(topic.id)} onOpenChange={() => toggle(topic.id)}
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/70 bg-card">
          <CollapsibleTrigger className="flex min-h-16 w-full items-center gap-3 p-5 text-left hover:bg-muted/50">
            <topic.icon className="h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1 font-semibold">{topic.title}</span>
            <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground ${query || openSections.includes(topic.id) ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 px-5 pb-5 pt-3 text-sm leading-relaxed text-muted-foreground">
            {topic.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            <div className="flex flex-wrap gap-x-5 gap-y-3 pt-2">{topic.links.map(link => <Link key={link.to} to={link.to} className="font-medium text-primary underline-offset-4 hover:underline">{link.label}</Link>)}</div>
          </CollapsibleContent>
        </Collapsible>)}
      </div>
    </div>
  </GuideLayout>;
}
