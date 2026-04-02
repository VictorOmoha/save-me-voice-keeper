import { j as jsxRuntimeExports, R as React, a as reactExports } from "./vendor-ui-CLSr_GWM.js";
import { B as Button, C as Card, e as CardHeader, f as CardTitle, D as Download, h as CardContent, p as printProfessionally, J as Jt, q as useParams, b as useNavigate, u as useAuth, d as db, N as Navigate } from "./index-CT7EzYyk.js";
import { D as DocumentCreator } from "./DocumentCreator-J_vwXBYC.js";
import { D as DataEntryForm, u as useCategoryFilter, a as DashboardLayout } from "./jspdf.es.min-iF735MOB.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { A as ArrowLeft } from "./arrow-left-CCcLkmU5.js";
import { P as Plus } from "./plus-DJOOR5Wx.js";
import { P as Printer } from "./EntryViewDialog-p97oVngN.js";
import { a as Copy } from "./user-CWEc4l4g.js";
import { E as ExportButton } from "./ExportButton-HGK5jlNS.js";
import { p as collection, t as query, w as where, x as orderBy, v as getDocs, d as doc, z as updateDoc, n as serverTimestamp, q as addDoc, r as deleteDoc } from "./vendor-firebase-N64baH19.js";
import "./vendor-charts-hYiuCXaC.js";
import "./input-B1KmmYia.js";
import "./label-Leg8N3DR.js";
import "./textarea-f5_v0hBa.js";
import "./select-CyBQ8QTa.js";
import "./check-CZQFmZAj.js";
import "./RichTextEditor-z_uT8gGf.js";
import "./vendor-editor-DOFb55Eh.js";
import "./upload-B7xhnkmR.js";
import "./save-5MLWtmAS.js";
import "./chevron-right-fa0SEsLi.js";
import "./layout-dashboard-C-fAhggi.js";
import "./settings-B0Fe-YOB.js";
import "./trending-up-F9qFPeih.js";
import "./users-C124q9JP.js";
import "./zap-CZIUQ85z.js";
import "./circle-alert-6cY5Ije4.js";
import "./volume-2-CGxA2eie.js";
import "./dialog-qADkFQn2.js";
import "./chevron-left-cv4Egzj6.js";
import "./square-check-big-Clnf_GY-.js";
import "./printUtils-DS2c1ZUl.js";
const CategoryHeader = ({
  categoryName,
  entriesCount,
  onBack,
  onCreateEntry
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
      onBack && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: onBack,
          variant: "ghost",
          size: "sm",
          className: "transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-x-1",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-2 transition-transform duration-200 ease-in-out hover:-translate-x-1" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold transition-all duration-200 ease-in-out hover:text-primary hover:scale-105", children: categoryName }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Badge,
        {
          variant: "secondary",
          className: "transition-all duration-200 ease-in-out hover:scale-110 hover:bg-primary hover:text-primary-foreground",
          children: [
            entriesCount,
            " entries"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        onClick: onCreateEntry,
        className: "bg-gradient-primary hover:opacity-90 text-primary-foreground transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1 hover:shadow-lg",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2 transition-transform duration-200 ease-in-out hover:rotate-90" }),
          "Create ",
          categoryName.slice(0, -1)
        ]
      }
    )
  ] });
};
const EntryCardComponent = ({
  entry,
  onEdit,
  onDelete,
  onFill,
  onUseAsTemplate,
  onDownload,
  isDownloading
}) => {
  const handlePrint = () => {
    printProfessionally([entry], { title: entry.title, includeMetadata: true });
    Jt.success("Print dialog opened");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "transform transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-2 animate-fade-in", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-2xl transition-all duration-300 ease-in-out border hover:border-primary/40 group cursor-pointer", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2 transition-all duration-200 ease-in-out", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-xl transition-all duration-200 ease-in-out group-hover:text-primary group-hover:scale-105", children: entry.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "transition-all duration-200 ease-in-out hover:scale-105", children: new Date(entry.createdAt).toLocaleDateString() }),
        entry.fields.fileName && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs transition-all duration-200 ease-in-out hover:scale-105", children: entry.fields.fileName }),
        entry.fields.hasUploadedFile && entry.fields.fileName && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => onDownload(entry),
            variant: "outline",
            size: "sm",
            disabled: isDownloading,
            className: "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 transition-transform duration-200 ease-in-out hover:rotate-12" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handlePrint,
            variant: "outline",
            size: "sm",
            className: "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "w-4 h-4 transition-transform duration-200 ease-in-out hover:rotate-12" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => onFill(entry),
            variant: "outline",
            size: "sm",
            className: "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1",
            children: "Fill Form"
          }
        ),
        onUseAsTemplate && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => onUseAsTemplate(entry),
            variant: "outline",
            size: "sm",
            className: "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4 mr-1" }),
              "Template"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => onEdit(entry),
            variant: "outline",
            size: "sm",
            className: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1",
            children: "Edit"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => onDelete(entry.id),
            variant: "outline",
            size: "sm",
            className: "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1",
            children: "Delete"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "transition-all duration-200 ease-in-out", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: Object.entries(entry.fields).map(([key, value], index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col sm:flex-row sm:items-center transition-all duration-200 ease-in-out hover:bg-accent/30 rounded-md p-2 -m-2",
        style: { animationDelay: `${index * 50}ms` },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground mb-1 sm:mb-0 sm:w-1/3 transition-colors duration-200 ease-in-out", children: [
            key,
            ":"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground sm:w-2/3 transition-colors duration-200 ease-in-out", children: key === "fileSize" && typeof value === "number" ? `${(value / 1024).toFixed(1)} KB` : String(value) })
        ]
      },
      key
    )) }) })
  ] }) });
};
const EntryCard = React.memo(EntryCardComponent, (prevProps, nextProps) => {
  return prevProps.entry.id === nextProps.entry.id && prevProps.entry.updatedAt === nextProps.entry.updatedAt && prevProps.isDownloading === nextProps.isDownloading;
});
const EmptyState = ({
  categoryName,
  onCreateEntry
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "transform transition-all duration-500 ease-in-out animate-fade-in", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "text-center py-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-6xl mb-4 transition-all duration-300 ease-in-out hover:scale-110 hover:rotate-12 cursor-default", children: "📝" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl font-semibold mb-2 transition-all duration-200 ease-in-out hover:text-primary", children: [
      "No ",
      categoryName.toLowerCase(),
      " entries yet"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-600 mb-6 transition-colors duration-200 ease-in-out hover:text-foreground/80", children: [
      "Create your first ",
      categoryName.toLowerCase(),
      " entry to get started!"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        onClick: onCreateEntry,
        className: "bg-gradient-primary hover:opacity-90 text-primary-foreground transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1 hover:shadow-lg",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2 transition-transform duration-200 ease-in-out hover:rotate-90" }),
          "Create ",
          categoryName.slice(0, -1)
        ]
      }
    )
  ] }) }) });
};
const useDownload = () => {
  const [downloadingFiles, setDownloadingFiles] = reactExports.useState([]);
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
  return { downloadingFiles, handleDownload };
};
const CategoryView = ({
  categoryName,
  entries,
  onBack,
  onEdit,
  onDelete,
  onFill,
  onUseAsTemplate,
  onCreateEntry,
  showDocumentCreator = false,
  showAddEntry = false,
  editingEntry = null,
  templateEntry = null,
  onDocumentSave = () => {
  },
  onDocumentCancel = () => {
  },
  onSaveEntry = () => {
  },
  onCancelEdit = () => {
  },
  getFormTitle = () => "Add New Entry",
  getFormMode = () => "create",
  isSaving = false
}) => {
  const { downloadingFiles, handleDownload } = useDownload();
  const { filterEntriesByCategory } = useCategoryFilter();
  console.log("DIAGNOSTIC: CategoryView rendered with:", {
    categoryName,
    showDocumentCreator,
    showAddEntry,
    editingEntry: editingEntry?.title,
    templateEntry: templateEntry?.title,
    totalEntries: entries.length
  });
  console.log("DIAGNOSTIC: All entries details:", entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    category: entry.fields.category,
    documentType: entry.fields.documentType,
    fileName: entry.fields.fileName,
    hasUploadedFile: entry.fields.hasUploadedFile,
    allFields: Object.keys(entry.fields)
  })));
  const handleCreateEntry = () => {
    console.log("DIAGNOSTIC: Create button clicked for category:", categoryName);
    onCreateEntry(categoryName);
  };
  const categoryEntries = filterEntriesByCategory(entries, categoryName);
  console.log("DIAGNOSTIC: Filtered entries for", categoryName, ":", {
    totalEntries: entries.length,
    categoryEntries: categoryEntries.length,
    categoryEntriesList: categoryEntries.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.fields.category,
      documentType: e.fields.documentType,
      fileName: e.fields.fileName
    }))
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CategoryHeader,
      {
        categoryName,
        entriesCount: categoryEntries.length,
        onBack,
        onCreateEntry: handleCreateEntry
      }
    ),
    showDocumentCreator && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DocumentCreator,
      {
        onSave: onDocumentSave,
        onCancel: onDocumentCancel
      }
    ) }) }),
    showAddEntry && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: getFormTitle() }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        DataEntryForm,
        {
          onSave: onSaveEntry,
          onCancel: onCancelEdit,
          editEntry: editingEntry,
          templateEntry,
          mode: getFormMode(),
          isSaving
        }
      ) })
    ] }),
    categoryEntries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyState,
      {
        categoryName,
        onCreateEntry: handleCreateEntry
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold", children: [
          categoryEntries.length,
          " ",
          categoryEntries.length === 1 ? "entry" : "entries",
          " in ",
          categoryName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ExportButton,
          {
            entries: categoryEntries,
            variant: "outline",
            size: "sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: categoryEntries.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        EntryCard,
        {
          entry,
          onEdit,
          onDelete,
          onFill,
          onUseAsTemplate,
          onDownload: handleDownload,
          isDownloading: downloadingFiles.includes(entry.id)
        },
        entry.id
      )) })
    ] })
  ] });
};
const VALID_CATEGORIES = ["Documents", "Health", "Contacts", "Finance", "Personal"];
function CategoryPage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = reactExports.useState([]);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showAddEntry, setShowAddEntry] = reactExports.useState(false);
  const [showDocumentCreator, setShowDocumentCreator] = reactExports.useState(false);
  const [editingEntry, setEditingEntry] = reactExports.useState(null);
  const [fillingEntry, setFillingEntry] = reactExports.useState(null);
  const [templateEntry, setTemplateEntry] = reactExports.useState(null);
  const [isFillMode, setIsFillMode] = reactExports.useState(false);
  const isValidCategory = !!categoryName && VALID_CATEGORIES.includes(categoryName);
  const loadEntries = reactExports.useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      console.error("No authenticated user");
      setEntries([]);
      return;
    }
    try {
      const entriesRef = collection(db, "entries");
      const q = query(
        entriesRef,
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const formattedEntries = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          fields: data.fields || {},
          fieldDefinitions: data.field_definitions || void 0,
          createdAt: data.created_at?.toDate() || /* @__PURE__ */ new Date(),
          updatedAt: data.updated_at?.toDate() || /* @__PURE__ */ new Date()
        };
      });
      setEntries(formattedEntries);
    } catch (error) {
      console.error("Error loading entries:", error);
      Jt.error("Failed to load entries");
      setEntries([]);
    }
  }, [user, authLoading]);
  reactExports.useEffect(() => {
    if (!authLoading && user) {
      loadEntries();
    }
  }, [user, authLoading, loadEntries]);
  reactExports.useEffect(() => {
    const handleEntriesChanged = () => {
      loadEntries();
    };
    window.addEventListener("nova:entries-changed", handleEntriesChanged);
    return () => window.removeEventListener("nova:entries-changed", handleEntriesChanged);
  }, [loadEntries]);
  const handleSaveEntry = async (entryData) => {
    if (!user) {
      Jt.error("You must be logged in to save entries");
      return;
    }
    try {
      if (editingEntry) {
        const entryRef = doc(db, "entries", editingEntry.id);
        await updateDoc(entryRef, {
          title: entryData.title,
          fields: entryData.fields,
          field_definitions: entryData.fieldDefinitions || null,
          updated_at: serverTimestamp()
        });
        Jt.success("Entry updated successfully!");
      } else {
        const entriesRef = collection(db, "entries");
        await addDoc(entriesRef, {
          title: entryData.title,
          fields: {
            ...entryData.fields,
            category: categoryName
          },
          field_definitions: entryData.fieldDefinitions || null,
          user_id: user.uid,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        Jt.success("Entry created successfully!");
      }
      await loadEntries();
      setShowAddEntry(false);
      setShowDocumentCreator(false);
      setEditingEntry(null);
      setFillingEntry(null);
    } catch (error) {
      console.error("Error saving entry:", error);
      Jt.error("Failed to save entry");
    }
  };
  const handleDeleteEntry = async (id) => {
    try {
      const entryRef = doc(db, "entries", id);
      await deleteDoc(entryRef);
      await loadEntries();
      Jt.success("Entry deleted successfully!");
    } catch (error) {
      console.error("Error deleting entry:", error);
      Jt.error("Failed to delete entry");
    }
  };
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFillingEntry(null);
    setTemplateEntry(null);
    setIsFillMode(false);
    setShowDocumentCreator(false);
    setShowAddEntry(true);
  };
  const handleFillEntry = (entry) => {
    setEditingEntry(entry);
    setFillingEntry(null);
    setTemplateEntry(null);
    setIsFillMode(true);
    setShowDocumentCreator(false);
    setShowAddEntry(true);
  };
  const handleUseAsTemplate = (entry) => {
    setTemplateEntry(entry);
    setEditingEntry(null);
    setFillingEntry(null);
    setIsFillMode(false);
    setShowDocumentCreator(false);
    setShowAddEntry(true);
  };
  const handleCreateEntry = (selectedCategory) => {
    console.log("Creating entry for category:", selectedCategory);
    setEditingEntry(null);
    setFillingEntry(null);
    setTemplateEntry(null);
    setIsFillMode(false);
    setShowDocumentCreator(false);
    setShowAddEntry(true);
  };
  const handleCancelEdit = () => {
    setShowAddEntry(false);
    setShowDocumentCreator(false);
    setEditingEntry(null);
    setFillingEntry(null);
    setTemplateEntry(null);
    setIsFillMode(false);
  };
  const getFormTitle = () => {
    if (templateEntry) return `New from: ${templateEntry.title}`;
    if (isFillMode && editingEntry) return `Fill: ${editingEntry.title}`;
    if (editingEntry) return `Edit ${editingEntry.title}`;
    return `Add New ${categoryName} Entry`;
  };
  const getFormMode = () => {
    if (templateEntry) return "template";
    if (isFillMode) return "fill";
    if (editingEntry) return "edit";
    return "create";
  };
  const filteredEntries = entries.filter(
    (entry) => entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || Object.values(entry.fields).some(
      (field) => String(field).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  reactExports.useEffect(() => {
    const handleNovaClose = () => {
      if (showAddEntry || showDocumentCreator) {
        handleCancelEdit();
      }
    };
    window.addEventListener("nova:close", handleNovaClose);
    return () => window.removeEventListener("nova:close", handleNovaClose);
  }, [showAddEntry, showDocumentCreator]);
  if (!isValidCategory || !categoryName) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/dashboard", replace: true });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DashboardLayout,
    {
      searchQuery,
      onSearchChange: setSearchQuery,
      savedEntries: entries,
      onAddEntry: () => handleCreateEntry(categoryName),
      onCategorySelect: (name) => navigate(`/category/${encodeURIComponent(name)}`),
      onAllEntriesSelect: () => navigate(`/all-entries`),
      onEditEntry: handleEditEntry,
      onDeleteEntry: handleDeleteEntry,
      onSaveEntry: handleSaveEntry,
      onCancelEdit: handleCancelEdit,
      onFillEntry: handleFillEntry,
      onUseAsTemplate: handleUseAsTemplate,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: categoryName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
              "Manage your ",
              categoryName.toLowerCase(),
              " entries"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleCreateEntry(categoryName), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
            "Add ",
            categoryName,
            " Entry"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CategoryView,
          {
            categoryName,
            entries: filteredEntries,
            onEdit: handleEditEntry,
            onDelete: handleDeleteEntry,
            onFill: handleFillEntry,
            onUseAsTemplate: handleUseAsTemplate,
            onCreateEntry: handleCreateEntry,
            showDocumentCreator,
            showAddEntry,
            editingEntry,
            templateEntry,
            onDocumentSave: handleSaveEntry,
            onDocumentCancel: handleCancelEdit,
            onSaveEntry: handleSaveEntry,
            onCancelEdit: handleCancelEdit,
            getFormTitle,
            getFormMode
          }
        )
      ]
    }
  );
}
export {
  CategoryPage as default
};
