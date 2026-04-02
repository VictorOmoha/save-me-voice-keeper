import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { c as createLucideIcon, i as cn, B as Button, j as Trash2, o as ChevronDown, D as Download, F as FileText, J as Jt, p as printProfessionally, b as useNavigate, q as useParams } from "./index-CT7EzYyk.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { i as Checkbox, P as Printer, S as SquarePen, j as EntryViewDialog } from "./EntryViewDialog-p97oVngN.js";
import { E as ExportButton } from "./ExportButton-HGK5jlNS.js";
import { D as DeleteConfirmDialog } from "./DeleteConfirmDialog-BJZqv53Z.js";
import { g as getEntryIntelligenceSignals } from "./entryIntelligence-oCqMJs6N.js";
import { C as ChevronRight } from "./chevron-right-fa0SEsLi.js";
import { a as Copy } from "./user-CWEc4l4g.js";
import { a as DashboardLayout, D as DataEntryForm } from "./jspdf.es.min-iF735MOB.js";
import { u as useSavedEntries } from "./useSavedEntries-BbNCU1rB.js";
import { EnhancedDocumentViewer } from "./EnhancedDocumentViewer-B2_epvOL.js";
import { DocumentEditor } from "./DocumentEditor-BLa1e3Ta.js";
import { D as Database } from "./database-CENvM7Pb.js";
import { P as Plus } from "./plus-DJOOR5Wx.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
import "./check-CZQFmZAj.js";
import "./input-B1KmmYia.js";
import "./zap-CZIUQ85z.js";
import "./trending-up-F9qFPeih.js";
import "./dialog-qADkFQn2.js";
import "./users-C124q9JP.js";
import "./chevron-left-cv4Egzj6.js";
import "./square-check-big-Clnf_GY-.js";
import "./label-Leg8N3DR.js";
import "./select-CyBQ8QTa.js";
import "./printUtils-DS2c1ZUl.js";
import "./alert-dialog-CQNFQ063.js";
import "./layout-dashboard-C-fAhggi.js";
import "./settings-B0Fe-YOB.js";
import "./textarea-f5_v0hBa.js";
import "./upload-B7xhnkmR.js";
import "./circle-alert-6cY5Ije4.js";
import "./volume-2-CGxA2eie.js";
import "./purify.es-DaUpxO-q.js";
import "./save-5MLWtmAS.js";
const ArrowUpDown = createLucideIcon("ArrowUpDown", [
  ["path", { d: "m21 16-4 4-4-4", key: "f6ql7i" }],
  ["path", { d: "M17 20V4", key: "1ejh1v" }],
  ["path", { d: "m3 8 4-4 4 4", key: "11wl7u" }],
  ["path", { d: "M7 4v16", key: "1glfcx" }]
]);
const Table = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
const TableHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
const TableFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tfoot",
  {
    ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
const TableHead = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "th",
  {
    ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "td",
  {
    ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
const EntriesTable = ({
  entries,
  onDelete,
  onEdit,
  onFill,
  onUseAsTemplate,
  onBulkDelete,
  onViewDocument
}) => {
  const [selectedEntries, setSelectedEntries] = reactExports.useState([]);
  const [expandedRows, setExpandedRows] = reactExports.useState([]);
  const [sortField, setSortField] = reactExports.useState("updatedAt");
  const [sortDirection, setSortDirection] = reactExports.useState("desc");
  const [viewingEntry, setViewingEntry] = reactExports.useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = reactExports.useState(false);
  const [downloadingFiles, setDownloadingFiles] = reactExports.useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = reactExports.useState(false);
  const [entryToDelete, setEntryToDelete] = reactExports.useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = reactExports.useState(false);
  if (entries.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 border border-dashed border-gray-300 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-6xl mb-4", children: "📝" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2", children: "No entries yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Start by adding your first entry using the form above or voice input!" })
    ] });
  }
  const handleDownload = async (entry) => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      Jt.error("No file available for download");
      return;
    }
    setDownloadingFiles((prev) => [...prev, entry.id]);
    try {
      const allKeys = Object.keys(localStorage);
      const documentKeys = allKeys.filter((key) => key.startsWith("document_"));
      let fileData = null;
      for (const key of documentKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || "");
          if (storedData.name === entry.fields.fileName) {
            fileData = storedData;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (!fileData) {
        Jt.error("File data not found in storage");
        return;
      }
      const link = document.createElement("a");
      link.href = fileData.data;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Jt.success(`Downloaded ${fileData.name}`);
    } catch (error) {
      console.error("Download error:", error);
      Jt.error("Failed to download file");
    } finally {
      setDownloadingFiles((prev) => prev.filter((id) => id !== entry.id));
    }
  };
  const handlePrint = (entry) => {
    printProfessionally([entry], { title: entry.title, includeMetadata: true });
    Jt.success("Print dialog opened");
  };
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const sortedEntries = [...entries].sort((a, b) => {
    let aValue, bValue;
    switch (sortField) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "updatedAt":
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      case "type":
        aValue = Object.keys(a.fields).length;
        bValue = Object.keys(b.fields).length;
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
  const toggleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(entries.map((entry) => entry.id));
    }
  };
  const toggleSelectEntry = (id) => {
    setSelectedEntries(
      (prev) => prev.includes(id) ? prev.filter((entryId) => entryId !== id) : [...prev, id]
    );
  };
  const toggleExpandRow = (id) => {
    setExpandedRows(
      (prev) => prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };
  const getEntryType = (entry) => {
    const fieldCount = Object.keys(entry.fields).length;
    if (fieldCount <= 2) return "Simple";
    if (fieldCount <= 5) return "Form";
    return "Complex";
  };
  const handleBulkDelete = () => {
    if (selectedEntries.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };
  const confirmBulkDelete = () => {
    onBulkDelete(selectedEntries);
    setSelectedEntries([]);
    setBulkDeleteDialogOpen(false);
  };
  const handleDeleteEntry = (entry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteEntry = () => {
    if (entryToDelete) {
      onDelete(entryToDelete.id);
      setEntryToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  const SortableHeader = ({ field, children }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    TableHead,
    {
      className: "cursor-pointer hover:bg-gray-50",
      onClick: () => handleSort(field),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpDown, { className: "h-4 w-4" })
      ] })
    }
  );
  const handleRowClick = (entry, event) => {
    const target = event.target;
    if (target.closest("button") || target.closest('[role="checkbox"]') || target.tagName === "INPUT") {
      return;
    }
    const fields = entry.fields;
    const category = typeof fields.category === "string" ? fields.category : "";
    const fileName = typeof fields.fileName === "string" ? fields.fileName : "";
    const fileType = typeof fields.fileType === "string" ? fields.fileType : "";
    const hasInline = Boolean(fields.documentContent);
    const isTextBased = hasInline || fileType.includes("text") || fileType.includes("html") || fileName.endsWith(".txt") || fileName.endsWith(".html");
    if (category === "Documents" && isTextBased && onViewDocument) {
      onViewDocument(entry);
      return;
    }
    setViewingEntry(entry);
    setIsViewDialogOpen(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Your Saved Information" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ExportButton,
          {
            entries,
            selectedEntries,
            variant: "outline",
            size: "sm"
          }
        ),
        selectedEntries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-gray-600", children: [
            selectedEntries.length,
            " selected"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleBulkDelete,
              variant: "destructive",
              size: "sm",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-1" }),
                "Delete Selected"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Checkbox,
          {
            checked: selectedEntries.length === entries.length,
            onCheckedChange: toggleSelectAll
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-12" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SortableHeader, { field: "title", children: "Title" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SortableHeader, { field: "type", children: "Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SortableHeader, { field: "updatedAt", children: "Last Modified" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Intelligence" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: sortedEntries.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TableRow,
          {
            className: "hover:bg-gray-50 cursor-pointer",
            onClick: (e) => handleRowClick(entry, e),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Checkbox,
                {
                  checked: selectedEntries.includes(entry.id),
                  onCheckedChange: () => toggleSelectEntry(entry.id)
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => toggleExpandRow(entry.id),
                  className: "p-0 h-auto",
                  children: expandedRows.includes(entry.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: entry.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: getEntryType(entry) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-gray-600", children: new Date(entry.updatedAt).toLocaleDateString() }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: (() => {
                const intelligence = getEntryIntelligenceSignals(entry);
                return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 max-w-[220px]", children: intelligence.isEnriched ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs border-primary/30 text-primary", children: "Smart" }),
                  intelligence.actionItemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs", children: [
                    intelligence.actionItemCount,
                    " actions"
                  ] }),
                  intelligence.linkedCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs", children: [
                    intelligence.linkedCount,
                    " linked"
                  ] }),
                  intelligence.reminderLikeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs border-amber-300 text-amber-700", children: "Deadline" }),
                  intelligence.tags.slice(0, 1).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, tag))
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) });
              })() }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                entry.fields.hasUploadedFile && entry.fields.fileName && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: () => handleDownload(entry),
                    variant: "ghost",
                    size: "sm",
                    disabled: downloadingFiles.includes(entry.id),
                    className: "text-green-600 hover:text-green-700",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: () => handlePrint(entry),
                    variant: "ghost",
                    size: "sm",
                    className: "text-purple-600 hover:text-purple-700",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: () => onFill(entry),
                    variant: "ghost",
                    size: "sm",
                    className: "text-green-600 hover:text-green-700",
                    title: "Fill Form",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: () => onUseAsTemplate(entry),
                    variant: "ghost",
                    size: "sm",
                    className: "text-purple-600 hover:text-purple-700",
                    title: "Use as Template",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: () => onEdit(entry),
                    variant: "ghost",
                    size: "sm",
                    className: "text-blue-600 hover:text-blue-700",
                    title: "Edit Entry",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: () => handleDeleteEntry(entry),
                    variant: "ghost",
                    size: "sm",
                    className: "text-red-600 hover:text-red-700",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ] }) })
            ]
          },
          entry.id
        ),
        expandedRows.includes(entry.id) && /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, className: "bg-gray-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-gray-900", children: "Fields Preview:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2", children: Object.entries(entry.fields).map(([key, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-700 min-w-0 w-1/3", children: [
              key,
              ":"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 break-words flex-1", children: String(value) })
          ] }, key)) })
        ] }) }) })
      ] })) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EntryViewDialog,
      {
        entry: viewingEntry,
        isOpen: isViewDialogOpen,
        onClose: () => {
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        },
        onEdit: (entry) => {
          onEdit(entry);
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        },
        onFill: (entry) => {
          onFill(entry);
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        },
        onUseAsTemplate: (entry) => {
          onUseAsTemplate(entry);
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        },
        onViewDocument
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DeleteConfirmDialog,
      {
        isOpen: deleteDialogOpen,
        onClose: () => {
          setDeleteDialogOpen(false);
          setEntryToDelete(null);
        },
        onConfirm: confirmDeleteEntry,
        title: entryToDelete?.title || ""
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DeleteConfirmDialog,
      {
        isOpen: bulkDeleteDialogOpen,
        onClose: () => setBulkDeleteDialogOpen(false),
        onConfirm: confirmBulkDelete,
        title: "",
        isMultiple: true,
        count: selectedEntries.length
      }
    )
  ] });
};
function AllEntries() {
  const {
    savedEntries: entries,
    isLoading,
    isSaving,
    searchQuery,
    setSearchQuery,
    saveEntry,
    deleteEntry,
    refreshEntries
  } = useSavedEntries();
  const navigate = useNavigate();
  const { entryId } = useParams();
  const [showAddEntry, setShowAddEntry] = reactExports.useState(false);
  const [editingEntry, setEditingEntry] = reactExports.useState(null);
  const [templateEntry, setTemplateEntry] = reactExports.useState(null);
  const [isFillMode, setIsFillMode] = reactExports.useState(false);
  const [documentViewerState, setDocumentViewerState] = reactExports.useState({ isOpen: false, entry: null });
  const [documentEditorState, setDocumentEditorState] = reactExports.useState({ isOpen: false, entry: null });
  const [selectedEntryDialog, setSelectedEntryDialog] = reactExports.useState({ isOpen: false, entry: null });
  const handleSaveEntry = async (entryData) => {
    try {
      await saveEntry(entryData, editingEntry);
      setShowAddEntry(false);
      setEditingEntry(null);
      setTemplateEntry(null);
      setIsFillMode(false);
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };
  const handleDeleteEntry = async (id) => {
    try {
      await deleteEntry(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };
  const handleBulkDelete = async (ids) => {
    try {
      for (const id of ids) {
        await deleteEntry(id);
      }
      Jt.success(`${ids.length} entries deleted successfully!`);
    } catch (error) {
      console.error("Error deleting entries:", error);
      Jt.error("Failed to delete entries");
    }
  };
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setTemplateEntry(null);
    setIsFillMode(false);
    setShowAddEntry(true);
  };
  const handleFillEntry = (entry) => {
    setEditingEntry(entry);
    setTemplateEntry(null);
    setIsFillMode(true);
    setShowAddEntry(true);
  };
  const handleUseAsTemplate = (entry) => {
    setEditingEntry(null);
    setTemplateEntry(entry);
    setIsFillMode(false);
    setShowAddEntry(true);
  };
  const handleCancelEdit = reactExports.useCallback(() => {
    setShowAddEntry(false);
    setEditingEntry(null);
    setTemplateEntry(null);
    setIsFillMode(false);
  }, []);
  const handleViewDocument = (entry) => {
    const fileName = String(entry.fields.fileName || "").toLowerCase();
    const fileType = String(entry.fields.fileType || "").toLowerCase();
    const isTextBased = fileName.endsWith(".txt") || fileName.endsWith(".html") || fileName.endsWith(".htm") || fileType.includes("text/plain") || fileType.includes("text/html");
    if (isTextBased) {
      setDocumentEditorState({ isOpen: true, entry });
    } else {
      setDocumentViewerState({ isOpen: true, entry });
    }
  };
  const handleCloseDocumentViewer = () => setDocumentViewerState({ isOpen: false, entry: null });
  const handleCloseDocumentEditor = () => setDocumentEditorState({ isOpen: false, entry: null });
  const handleEditFromViewer = (entry) => {
    setDocumentViewerState({ isOpen: false, entry: null });
    setDocumentEditorState({ isOpen: true, entry });
  };
  const handleDocumentSaved = () => {
    Jt.success("Document updated successfully!");
    refreshEntries();
    setDocumentEditorState({ isOpen: false, entry: null });
  };
  const handleOpenRelatedEntry = (entry) => {
    setSelectedEntryDialog({ isOpen: true, entry });
    navigate(`/all-entries/${entry.id}`);
  };
  reactExports.useEffect(() => {
    if (entryId && entries.length > 0 && !isLoading) {
      const entry = entries.find((e) => e.id === entryId);
      if (entry) {
        setSelectedEntryDialog({ isOpen: true, entry });
      }
    }
  }, [entryId, entries, isLoading]);
  reactExports.useEffect(() => {
    const handleNovaClose = () => {
      if (showAddEntry) {
        handleCancelEdit();
      }
      if (selectedEntryDialog.isOpen) {
        setSelectedEntryDialog({ isOpen: false, entry: null });
      }
      if (documentViewerState.isOpen) {
        setDocumentViewerState({ isOpen: false, entry: null });
      }
      if (documentEditorState.isOpen) {
        setDocumentEditorState({ isOpen: false, entry: null });
      }
    };
    const handleEntriesChanged = () => {
      refreshEntries();
    };
    window.addEventListener("nova:close", handleNovaClose);
    window.addEventListener("nova:entries-changed", handleEntriesChanged);
    return () => {
      window.removeEventListener("nova:close", handleNovaClose);
      window.removeEventListener("nova:entries-changed", handleEntriesChanged);
    };
  }, [showAddEntry, selectedEntryDialog.isOpen, documentViewerState.isOpen, documentEditorState.isOpen, handleCancelEdit, refreshEntries]);
  if (isLoading) {
    const handleCategorySelectNav = (name) => navigate(`/category/${encodeURIComponent(name)}`);
    const handleAllEntriesSelectNav = () => navigate(`/all-entries`);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardLayout,
      {
        searchQuery,
        onSearchChange: setSearchQuery,
        savedEntries: entries,
        onAddEntry: () => setShowAddEntry(true),
        onCategorySelect: handleCategorySelectNav,
        onAllEntriesSelect: handleAllEntriesSelectNav,
        onEditEntry: handleEditEntry,
        onDeleteEntry: handleDeleteEntry,
        onSaveEntry: () => {
        },
        onCancelEdit: handleCancelEdit,
        onFillEntry: handleFillEntry,
        onUseAsTemplate: handleUseAsTemplate,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 border border-galvanized flex items-center justify-center mx-auto mb-4 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mono text-xs text-muted-foreground", children: "LOADING_ENTRIES..." })
        ] }) })
      }
    );
  }
  const filteredEntries = entries;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DashboardLayout,
    {
      searchQuery,
      onSearchChange: setSearchQuery,
      savedEntries: entries,
      onAddEntry: () => setShowAddEntry(true),
      onCategorySelect: (name) => navigate(`/category/${encodeURIComponent(name)}`),
      onAllEntriesSelect: () => navigate(`/all-entries`),
      onEditEntry: handleEditEntry,
      onDeleteEntry: handleDeleteEntry,
      onSaveEntry: () => {
      },
      onCancelEdit: handleCancelEdit,
      onFillEntry: handleFillEntry,
      onUseAsTemplate: handleUseAsTemplate,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "protocol-tag mb-3", children: "PROTOCOL: DATA_RETRIEVAL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "archive-title text-2xl mb-1", children: "ALL_ENTRIES" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mono text-xs text-muted-foreground", children: [
                filteredEntries.length,
                " ",
                filteredEntries.length === 1 ? "RECORD" : "RECORDS",
                " IN_ARCHIVE"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setShowAddEntry(true),
                className: "btn-galvanized btn-galvanized-primary",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                  "ADD_ENTRY"
                ]
              }
            )
          ] })
        ] }),
        showAddEntry && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "galvanized-card p-6 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mono text-sm font-bold text-foreground mb-4 pb-3 border-b border-galvanized", children: isFillMode ? "FILL_FORM" : editingEntry ? "EDIT_ENTRY" : templateEntry ? "NEW_FROM_TEMPLATE" : "CREATE_NEW_ENTRY" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataEntryForm,
            {
              onSave: handleSaveEntry,
              onCancel: handleCancelEdit,
              editEntry: editingEntry,
              templateEntry,
              mode: isFillMode ? "fill" : editingEntry ? "edit" : templateEntry ? "template" : "create",
              isSaving
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          EntriesTable,
          {
            entries: filteredEntries,
            onDelete: handleDeleteEntry,
            onEdit: handleEditEntry,
            onFill: handleFillEntry,
            onUseAsTemplate: handleUseAsTemplate,
            onBulkDelete: handleBulkDelete,
            onViewDocument: handleViewDocument
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          EnhancedDocumentViewer,
          {
            isOpen: documentViewerState.isOpen,
            onClose: handleCloseDocumentViewer,
            entry: documentViewerState.entry,
            onEdit: handleEditFromViewer,
            allEntries: entries,
            onOpenRelatedEntry: handleOpenRelatedEntry
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DocumentEditor,
          {
            isOpen: documentEditorState.isOpen,
            onClose: handleCloseDocumentEditor,
            entry: documentEditorState.entry,
            onSave: handleDocumentSaved
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          EntryViewDialog,
          {
            entry: selectedEntryDialog.entry,
            isOpen: selectedEntryDialog.isOpen,
            onClose: () => {
              setSelectedEntryDialog({ isOpen: false, entry: null });
              navigate("/all-entries");
            },
            onEdit: (entry) => {
              handleEditEntry(entry);
              setSelectedEntryDialog({ isOpen: false, entry: null });
              navigate("/all-entries");
            },
            onFill: (entry) => {
              handleFillEntry(entry);
              setSelectedEntryDialog({ isOpen: false, entry: null });
              navigate("/all-entries");
            },
            onUseAsTemplate: (entry) => {
              handleUseAsTemplate(entry);
              setSelectedEntryDialog({ isOpen: false, entry: null });
              navigate("/all-entries");
            },
            onViewDocument: handleViewDocument,
            allEntries: entries,
            onOpenRelatedEntry: handleOpenRelatedEntry
          }
        )
      ]
    }
  );
}
export {
  AllEntries as default
};
