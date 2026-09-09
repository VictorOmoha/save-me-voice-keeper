import {ReactNode} from "react";
import {useNavigate} from "react-router-dom";
import {DashboardLayout} from "@/components/dashboard/DashboardLayout";
import {useSavedEntries} from "@/hooks/useSavedEntries";

/** Shared navigation for workspace tools that do not own an entry editor. */
export function WorkspacePage({children}: {children: ReactNode}) {
  const navigate = useNavigate();
  const {allSavedEntries, searchQuery, setSearchQuery} = useSavedEntries();
  return <DashboardLayout savedEntries={allSavedEntries} searchQuery={searchQuery} onSearchChange={setSearchQuery}
    onAddEntry={() => navigate('/dashboard?action=create')}
    onCategorySelect={(category) => navigate(`/category/${encodeURIComponent(category)}`)}
    onAllEntriesSelect={() => navigate('/all-entries')}
    onEditEntry={(entry) => navigate(`/all-entries/${entry.id}`)}
    onDeleteEntry={() => {}} onSaveEntry={() => {}} onCancelEdit={() => {}}>
    {children}
  </DashboardLayout>;
}

export function WorkspacePageHeader({title, description, eyebrow, actions}: {title: string; description?: string; eyebrow?: string; actions?: ReactNode}) {
  return <header className="workspace-page-header mb-7 flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">{eyebrow && <p className="workspace-eyebrow mb-2">{eyebrow}</p>}
      <h1 className="text-2xl md:text-[30px] font-semibold tracking-tight leading-tight">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>;
}
