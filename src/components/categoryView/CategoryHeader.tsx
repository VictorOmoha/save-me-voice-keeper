import {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {Plus} from 'lucide-react';
import {WorkspacePageHeader} from '@/components/workspace/WorkspacePage';
const descriptions: Record<string, string> = {
  Documents: 'Your files, reference material, and important paperwork, together.',
  Health: 'Keep appointments, care notes, and health information easy to find.',
  Contacts: 'Remember the people you meet and the details that matter.',
  Finance: 'A place for budgets, renewals, and financial notes.',
  Personal: 'Ideas, everyday notes, and the things you want to keep.',
};
export function CategoryHeader({categoryName, entriesCount, onCreateEntry, actions, isEditing = false}: {
  categoryName: string; entriesCount: number; onBack?: () => void; onCreateEntry: () => void; actions?: ReactNode; isEditing?: boolean;
}) {
  return <WorkspacePageHeader title={categoryName} eyebrow={`Collection · ${entriesCount} ${entriesCount === 1 ? 'memory' : 'memories'}`}
    description={descriptions[categoryName]} actions={!isEditing && <>{actions}<Button onClick={onCreateEntry} className="min-h-11"><Plus className="mr-2 h-4 w-4" />Add memory</Button></>} />;
}
