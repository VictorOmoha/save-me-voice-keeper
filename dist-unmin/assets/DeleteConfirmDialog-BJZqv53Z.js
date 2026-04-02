import { j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CQNFQ063.js";
import { j as Trash2 } from "./index-CT7EzYyk.js";
const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isMultiple = false,
  count = 1
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-5 w-5 text-destructive" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isMultiple ? `Delete ${count} Entries` : "Delete Entry" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: description || (isMultiple ? `Are you sure you want to delete ${count} entries? This action cannot be undone.` : `Are you sure you want to delete "${title}"? This action cannot be undone.`) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        AlertDialogAction,
        {
          onClick: handleConfirm,
          className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          children: [
            "Delete ",
            isMultiple ? "All" : ""
          ]
        }
      )
    ] })
  ] }) });
};
export {
  DeleteConfirmDialog as D
};
