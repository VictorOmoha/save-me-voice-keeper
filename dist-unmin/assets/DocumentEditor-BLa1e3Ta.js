const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/RichTextEditor-z_uT8gGf.js","assets/vendor-ui-CLSr_GWM.js","assets/vendor-editor-DOFb55Eh.js","assets/index-CT7EzYyk.js","assets/vendor-charts-hYiuCXaC.js","assets/vendor-firebase-N64baH19.js","assets/index-DFlzwyhZ.css","assets/printUtils-DS2c1ZUl.js","assets/jspdf.es.min-iF735MOB.js","assets/EntryViewDialog-p97oVngN.js","assets/chevron-right-fa0SEsLi.js","assets/check-CZQFmZAj.js","assets/input-B1KmmYia.js","assets/zap-CZIUQ85z.js","assets/trending-up-F9qFPeih.js","assets/badge-CRUpIyW6.js","assets/dialog-qADkFQn2.js","assets/users-C124q9JP.js","assets/user-CWEc4l4g.js","assets/chevron-left-cv4Egzj6.js","assets/square-check-big-Clnf_GY-.js","assets/plus-DJOOR5Wx.js","assets/layout-dashboard-C-fAhggi.js","assets/settings-B0Fe-YOB.js","assets/label-Leg8N3DR.js","assets/select-CyBQ8QTa.js","assets/textarea-f5_v0hBa.js","assets/upload-B7xhnkmR.js","assets/circle-alert-6cY5Ije4.js","assets/volume-2-CGxA2eie.js"])))=>i.map(i=>d[i]);
import { u as useAuth, s as storage, J as Jt, F as FileText, B as Button, X, _ as __vitePreload, d as db } from "./index-CT7EzYyk.js";
import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-qADkFQn2.js";
import { T as Textarea } from "./textarea-f5_v0hBa.js";
import { A as ref, J as getBlob, B as uploadBytes, d as doc, z as updateDoc } from "./vendor-firebase-N64baH19.js";
import { P as PenLine } from "./jspdf.es.min-iF735MOB.js";
import { P as Printer } from "./EntryViewDialog-p97oVngN.js";
import { S as Save } from "./save-5MLWtmAS.js";
import "./vendor-charts-hYiuCXaC.js";
import "./plus-DJOOR5Wx.js";
import "./user-CWEc4l4g.js";
import "./chevron-right-fa0SEsLi.js";
import "./layout-dashboard-C-fAhggi.js";
import "./settings-B0Fe-YOB.js";
import "./trending-up-F9qFPeih.js";
import "./users-C124q9JP.js";
import "./input-B1KmmYia.js";
import "./label-Leg8N3DR.js";
import "./select-CyBQ8QTa.js";
import "./check-CZQFmZAj.js";
import "./badge-CRUpIyW6.js";
import "./upload-B7xhnkmR.js";
import "./zap-CZIUQ85z.js";
import "./circle-alert-6cY5Ije4.js";
import "./volume-2-CGxA2eie.js";
import "./chevron-left-cv4Egzj6.js";
import "./square-check-big-Clnf_GY-.js";
const RichTextEditor = reactExports.lazy(
  () => __vitePreload(() => import("./RichTextEditor-z_uT8gGf.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6]) : void 0).then((module) => ({ default: module.RichTextEditor }))
);
const DocumentEditor = ({
  isOpen,
  onClose,
  entry,
  onSave
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const [documentContent, setDocumentContent] = reactExports.useState("");
  const [originalContent, setOriginalContent] = reactExports.useState("");
  const [hasChanges, setHasChanges] = reactExports.useState(false);
  const fileName = entry?.fields?.fileName || "";
  const fileType = entry?.fields?.fileType || "";
  const hasInline = Boolean(entry?.fields?.documentContent);
  const isTextBased = hasInline || fileType.includes("text") || fileType.includes("html") || fileName.endsWith(".txt") || fileName.endsWith(".html");
  const isHtml = fileName.endsWith(".html") || fileType.includes("html");
  const loadDocumentForEditing = reactExports.useCallback(async () => {
    if (!entry) return;
    try {
      setIsLoading(true);
      if (!user) {
        console.warn("No authenticated user while loading document");
      }
      const explicitPath = entry.fields?.storagePath;
      const defaultFileName = fileName || "document.txt";
      const computedPath = user ? `documents/${user.uid}/${entry.id}/${defaultFileName}` : `documents/${entry.id}/${defaultFileName}`;
      const filePath = explicitPath || computedPath;
      if (filePath) {
        try {
          const storageRef = ref(storage, filePath);
          const blob = await getBlob(storageRef);
          const text = await blob.text();
          setDocumentContent(text);
          setOriginalContent(text);
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn("Storage download error (will try fallbacks):", message);
        }
      }
      if (entry.fields?.documentContent) {
        const content = entry.fields.documentContent;
        setDocumentContent(content);
        setOriginalContent(content);
        return;
      }
      const localKey = Object.keys(localStorage).find(
        (key) => key.startsWith("document_") && (() => {
          try {
            return JSON.parse(localStorage.getItem(key) || "{}").name === defaultFileName;
          } catch {
            return false;
          }
        })()
      );
      if (localKey) {
        try {
          const fileData = JSON.parse(localStorage.getItem(localKey) || "{}");
          const byteCharacters = atob(String(fileData.data || "").split(",")[1] || "");
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.type || "text/plain" });
          const text = await blob.text();
          setDocumentContent(text);
          setOriginalContent(text);
          return;
        } catch (e) {
          console.warn("Failed to parse localStorage document cache:", e);
        }
      }
      setDocumentContent("");
      setOriginalContent("");
    } catch (error) {
      console.error("Error loading document for editing:", error);
      Jt.error("Failed to load document for editing");
    } finally {
      setIsLoading(false);
    }
  }, [entry, fileName, user]);
  const handleClose = reactExports.useCallback(() => {
    if (hasChanges) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirmClose) return;
    }
    onClose();
  }, [hasChanges, onClose]);
  reactExports.useEffect(() => {
    if (isOpen && entry) {
      loadDocumentForEditing();
    }
  }, [isOpen, entry, loadDocumentForEditing]);
  reactExports.useEffect(() => {
    const handleNovaClose = () => {
      if (isOpen) {
        handleClose();
      }
    };
    window.addEventListener("nova:close", handleNovaClose);
    return () => window.removeEventListener("nova:close", handleNovaClose);
  }, [isOpen, handleClose]);
  reactExports.useEffect(() => {
    setHasChanges(documentContent !== originalContent);
  }, [documentContent, originalContent]);
  const handleSave = async () => {
    if (!hasChanges || !entry) {
      Jt.info("No changes to save");
      return;
    }
    if (!user) {
      Jt.error("User not authenticated");
      return;
    }
    try {
      setIsSaving(true);
      const mime = isHtml ? "text/html" : fileType || "text/plain";
      const updatedBlob = new Blob([documentContent], { type: mime });
      const existingStoragePath = entry.fields?.storagePath;
      const safeFileName = fileName || (isHtml ? "document.html" : "document.txt");
      const filePath = existingStoragePath || `documents/${user.uid}/${entry.id}/${safeFileName}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, updatedBlob, {
        contentType: mime
      });
      const updatedFields = {
        ...entry.fields,
        documentContent,
        // Store content for quick access
        storagePath: filePath,
        // Persist the storage path for faster future loads
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const entryRef = doc(db, "entries", entry.id);
      await updateDoc(entryRef, {
        fields: updatedFields,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      setOriginalContent(documentContent);
      setHasChanges(false);
      if (onSave) {
        const updatedEntry = {
          ...entry,
          fields: updatedFields,
          updatedAt: /* @__PURE__ */ new Date()
        };
        onSave(updatedEntry);
      }
      Jt.success("Document saved successfully!");
    } catch (error) {
      console.error("Error saving document:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      Jt.error(`Failed to save document: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };
  const textToHtml = (text) => {
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const withBreaks = esc.split("\n").join("<br>");
    return `<pre>${withBreaks}</pre>`;
  };
  const handlePrint = async () => {
    try {
      const title = entry?.title || fileName || "Document";
      const body = isHtml ? documentContent : textToHtml(documentContent);
      const { printDocumentHtml } = await __vitePreload(async () => {
        const { printDocumentHtml: printDocumentHtml2 } = await import("./printUtils-DS2c1ZUl.js");
        return { printDocumentHtml: printDocumentHtml2 };
      }, true ? __vite__mapDeps([7,8,1,9,3,4,5,6,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29]) : void 0);
      printDocumentHtml(title, body);
      Jt.success("Opening print dialog...");
    } catch (e) {
      console.error("Error printing document:", e);
      Jt.error("Failed to open print dialog");
    }
  };
  if (!isTextBased) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Cannot Edit Document" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Only text-based files (TXT, HTML) can be edited in-browser." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "w-12 h-12 text-muted-foreground mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "This document type cannot be edited in the browser. Only text-based files (TXT, HTML) can be edited." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, variant: "outline", children: "Close" }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-5xl max-h-[90vh] overflow-hidden flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "flex-shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Editing: ",
            entry?.title || "Document"
          ] }),
          hasChanges && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-orange-500", children: "(unsaved changes)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handlePrint,
              variant: "outline",
              size: "sm",
              className: "flex items-center space-x-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Print" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleSave,
              disabled: !hasChanges || isSaving,
              size: "sm",
              className: "flex items-center space-x-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isSaving ? "Saving..." : "Save" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Edit your text document" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-hidden flex flex-col space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-muted/50 p-3 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "File:" }),
          " ",
          fileName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Type:" }),
          " ",
          fileType || "text/plain"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Last modified:" }),
          " ",
          entry?.updatedAt ? entry.updatedAt.toLocaleDateString() : ""
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-hidden border border-border rounded-lg", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center h-64", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-muted-foreground", children: "Loading document..." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex flex-col", children: isHtml ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Loading editor…" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        RichTextEditor,
        {
          content: documentContent,
          onContentChange: setDocumentContent,
          placeholder: "Start editing your HTML document..."
        }
      ) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          value: documentContent,
          onChange: (e) => setDocumentContent(e.target.value),
          placeholder: "Start editing your document...",
          className: "flex-1 resize-none border-0 rounded-none focus:ring-0 font-mono text-sm",
          style: { minHeight: "400px" }
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-shrink-0 flex justify-between pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
        documentContent.length,
        " characters"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex space-x-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleClose, variant: "outline", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4 mr-2" }),
        hasChanges ? "Cancel" : "Close"
      ] }) })
    ] })
  ] }) });
};
export {
  DocumentEditor
};
