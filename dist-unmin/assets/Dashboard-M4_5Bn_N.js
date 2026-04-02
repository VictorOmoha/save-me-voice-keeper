const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/DocumentCreator-J_vwXBYC.js","assets/vendor-ui-CLSr_GWM.js","assets/index-CT7EzYyk.js","assets/vendor-charts-hYiuCXaC.js","assets/vendor-firebase-N64baH19.js","assets/index-DFlzwyhZ.css","assets/input-B1KmmYia.js","assets/label-Leg8N3DR.js","assets/textarea-f5_v0hBa.js","assets/select-CyBQ8QTa.js","assets/check-CZQFmZAj.js","assets/jspdf.es.min-iF735MOB.js","assets/EntryViewDialog-p97oVngN.js","assets/chevron-right-fa0SEsLi.js","assets/zap-CZIUQ85z.js","assets/trending-up-F9qFPeih.js","assets/badge-CRUpIyW6.js","assets/dialog-qADkFQn2.js","assets/users-C124q9JP.js","assets/user-CWEc4l4g.js","assets/chevron-left-cv4Egzj6.js","assets/square-check-big-Clnf_GY-.js","assets/plus-DJOOR5Wx.js","assets/layout-dashboard-C-fAhggi.js","assets/settings-B0Fe-YOB.js","assets/upload-B7xhnkmR.js","assets/circle-alert-6cY5Ije4.js","assets/volume-2-CGxA2eie.js","assets/RichTextEditor-z_uT8gGf.js","assets/vendor-editor-DOFb55Eh.js","assets/save-5MLWtmAS.js","assets/EnhancedDocumentViewer-B2_epvOL.js","assets/printUtils-DS2c1ZUl.js","assets/purify.es-DaUpxO-q.js","assets/DocumentEditor-BLa1e3Ta.js"])))=>i.map(i=>d[i]);
import { c as createLucideIcon, F as FileText, T as Tag, i as cn, B as Button, D as Download, j as Trash2, C as Card, h as CardContent, p as printProfessionally, J as Jt, X, b as useNavigate, e as CardHeader, S as Sparkles, f as CardTitle, k as List, l as auth, d as db, t as toast, u as useAuth, m as Brain, n as useSearchParams, _ as __vitePreload } from "./index-CT7EzYyk.js";
import { R as React, j as jsxRuntimeExports, a as reactExports } from "./vendor-ui-CLSr_GWM.js";
import { d as doc, l as getDoc, v as getDocs, t as query, p as collection, w as where, x as orderBy, y as limit } from "./vendor-firebase-N64baH19.js";
import { D as DataEntryForm, T as Table, a as DashboardLayout } from "./jspdf.es.min-iF735MOB.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { D as DollarSign, a as DropdownMenu, b as DropdownMenuTrigger, c as DropdownMenuContent, d as DropdownMenuItem, S as SquarePen, P as Printer, e as DropdownMenuSeparator, C as Clock, f as extractImagesFromEntry, I as ImageGallery, E as EntryIntelligencePanel, g as ShoppingListCardViewer, T as TableFieldViewer, l as logError, G as Grid3x3, h as SmartSearchWithBoundary } from "./EntryViewDialog-p97oVngN.js";
import { F as FileCheck, D as DocumentCreator$1 } from "./DocumentCreator-J_vwXBYC.js";
import { S as Shield, E as ExternalLink, A as Activity } from "./shield-Bq4K0s6C.js";
import { U as User, C as CreditCard, E as Eye, a as Copy } from "./user-CWEc4l4g.js";
import { M as Mail } from "./mail-C7YTOEcz.js";
import { U as Users } from "./users-C124q9JP.js";
import { H as Heart } from "./trending-up-F9qFPeih.js";
import { g as getEntryIntelligenceSignals } from "./entryIntelligence-oCqMJs6N.js";
import { D as Dialog, a as DialogContent, c as DialogTitle } from "./dialog-qADkFQn2.js";
import "./input-B1KmmYia.js";
import { C as ChevronRight } from "./chevron-right-fa0SEsLi.js";
import { F as FolderOpen } from "./folder-open-C92-D7ty.js";
import { P as Plus } from "./plus-DJOOR5Wx.js";
import { R as Radar, B as BellRing } from "./radar-Ch-ViE1I.js";
import { A as ArrowRight } from "./arrow-right-BytWGEK7.js";
import { S as SquareCheckBig, L as Link2 } from "./square-check-big-Clnf_GY-.js";
import { Z as Zap } from "./zap-CZIUQ85z.js";
import { D as DeleteConfirmDialog } from "./DeleteConfirmDialog-BJZqv53Z.js";
import { u as useDashboard } from "./useDashboard-Bdz-0Z01.js";
import "./vendor-charts-hYiuCXaC.js";
import "./layout-dashboard-C-fAhggi.js";
import "./settings-B0Fe-YOB.js";
import "./label-Leg8N3DR.js";
import "./select-CyBQ8QTa.js";
import "./check-CZQFmZAj.js";
import "./textarea-f5_v0hBa.js";
import "./upload-B7xhnkmR.js";
import "./circle-alert-6cY5Ije4.js";
import "./volume-2-CGxA2eie.js";
import "./chevron-left-cv4Egzj6.js";
import "./RichTextEditor-z_uT8gGf.js";
import "./vendor-editor-DOFb55Eh.js";
import "./save-5MLWtmAS.js";
import "./alert-dialog-CQNFQ063.js";
import "./useSavedEntries-BbNCU1rB.js";
const Briefcase = createLucideIcon("Briefcase", [
  ["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", key: "jecpp" }],
  ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2", key: "i6l2r4" }]
]);
const Calendar = createLucideIcon("Calendar", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
]);
const Ellipsis = createLucideIcon("Ellipsis", [
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  ["circle", { cx: "19", cy: "12", r: "1", key: "1wjl8i" }],
  ["circle", { cx: "5", cy: "12", r: "1", key: "1pcz8c" }]
]);
const HardDrive = createLucideIcon("HardDrive", [
  ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ],
  ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
  ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }]
]);
const MapPin = createLucideIcon("MapPin", [
  [
    "path",
    {
      d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
      key: "1r0f0z"
    }
  ],
  ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
]);
const Phone = createLucideIcon("Phone", [
  [
    "path",
    {
      d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
      key: "foiqr5"
    }
  ]
]);
const Pill = createLucideIcon("Pill", [
  [
    "path",
    { d: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z", key: "wa1lgi" }
  ],
  ["path", { d: "m8.5 8.5 7 7", key: "rvfmvr" }]
]);
const Star = createLucideIcon("Star", [
  [
    "path",
    {
      d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
      key: "r04s7s"
    }
  ]
]);
const categoryConfig = {
  Documents: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    gradientFrom: "from-blue-500",
    gradientTo: "to-blue-600",
    priorityFields: ["documentType", "description", "expirationDate", "issuer"],
    fieldIcons: {
      documentType: FileCheck,
      expirationDate: Calendar,
      issuer: Briefcase
    }
  },
  Health: {
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    gradientFrom: "from-red-500",
    gradientTo: "to-rose-600",
    priorityFields: ["condition", "medication", "doctor", "hospital", "dosage", "nextAppointment"],
    fieldIcons: {
      medication: Pill,
      doctor: User,
      hospital: MapPin,
      nextAppointment: Calendar
    }
  },
  Contacts: {
    icon: Users,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600",
    priorityFields: ["name", "phone", "email", "company", "relationship", "address"],
    fieldIcons: {
      phone: Phone,
      email: Mail,
      company: Briefcase,
      address: MapPin
    }
  },
  Finance: {
    icon: DollarSign,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-600",
    priorityFields: ["accountType", "accountNumber", "bank", "balance", "cardNumber"],
    fieldIcons: {
      accountNumber: CreditCard,
      bank: Briefcase,
      cardNumber: CreditCard
    }
  },
  Personal: {
    icon: User,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    gradientFrom: "from-purple-500",
    gradientTo: "to-violet-600",
    priorityFields: ["notes", "description", "date", "reminder"],
    fieldIcons: {
      date: Calendar
    }
  },
  Insurance: {
    icon: Shield,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    gradientFrom: "from-teal-500",
    gradientTo: "to-cyan-600",
    priorityFields: ["policyNumber", "provider", "coverage", "premium", "expirationDate"],
    fieldIcons: {
      policyNumber: FileCheck,
      provider: Briefcase,
      expirationDate: Calendar
    }
  }
};
const defaultCategoryConfig = {
  icon: Tag,
  color: "text-gray-600 dark:text-gray-400",
  bgColor: "bg-gray-50 dark:bg-gray-950/30",
  borderColor: "border-gray-200 dark:border-gray-800",
  gradientFrom: "from-gray-500",
  gradientTo: "to-gray-600",
  priorityFields: [],
  fieldIcons: {}
};
const getCategoryConfig = (category) => {
  return categoryConfig[category] || defaultCategoryConfig;
};
const formatFieldValue$1 = (key, value) => {
  if (value === null || value === void 0 || value === "") return "—";
  const keyLower = key.toLowerCase();
  if (keyLower.includes("size") && typeof value === "number") {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (keyLower.includes("date") || keyLower.includes("expir")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  }
  if (keyLower.includes("phone") || keyLower.includes("mobile") || keyLower.includes("tel")) {
    const cleaned = String(value).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  }
  if (keyLower.includes("balance") || keyLower.includes("amount") || keyLower.includes("price") || keyLower.includes("cost") || keyLower.includes("premium")) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(num);
    }
  }
  if (keyLower.includes("cardnumber") || keyLower.includes("accountnumber")) {
    const str = String(value);
    if (str.length >= 4) {
      return `****${str.slice(-4)}`;
    }
  }
  if (keyLower.includes("ssn") || keyLower.includes("socialsecurity")) {
    const str = String(value).replace(/\D/g, "");
    if (str.length >= 4) {
      return `***-**-${str.slice(-4)}`;
    }
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object" && value !== null) {
    if ("columns" in value && "rows" in value) {
      return `[Table: ${value.rows?.length || 0} rows]`;
    }
    return JSON.stringify(value);
  }
  const strValue = String(value);
  if (strValue.length > 150) {
    return strValue.slice(0, 150) + "...";
  }
  return strValue;
};
const formatFieldName = (key) => {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).replace(/_/g, " ").replace(/\s+/g, " ").trim();
};
const metadataFields = [
  "category",
  "hasUploadedFile",
  "fileName",
  "fileSize",
  "fileType",
  "documentType",
  "storagePath",
  "documentContent",
  "documentNotesHtml",
  "updatedAt"
];
const EnhancedEntryCardComponent = ({
  entry,
  onView,
  onEdit,
  onDelete,
  onFill,
  onUseAsTemplate,
  onDownload,
  onPrint,
  variant = "grid",
  className
}) => {
  const handlePrint = (e) => {
    e?.stopPropagation();
    if (onPrint) {
      onPrint(entry);
    } else {
      printProfessionally([entry], { title: entry.title, includeMetadata: true });
      Jt.success("Print dialog opened");
    }
  };
  const category = entry.fields.category || "Personal";
  const config = getCategoryConfig(category);
  const CategoryIcon = config.icon;
  const displayFields = Object.entries(entry.fields).filter(([key]) => !metadataFields.includes(key)).filter(([_, value]) => value !== null && value !== void 0 && value !== "");
  const sortedFields = displayFields.sort(([keyA], [keyB]) => {
    const priorityA = config.priorityFields.indexOf(keyA);
    const priorityB = config.priorityFields.indexOf(keyB);
    if (priorityA === -1 && priorityB === -1) return 0;
    if (priorityA === -1) return 1;
    if (priorityB === -1) return -1;
    return priorityA - priorityB;
  });
  const maxPreviewFields = variant === "compact" ? 2 : variant === "list" ? 3 : 4;
  const previewFields = sortedFields.slice(0, maxPreviewFields);
  const remainingCount = sortedFields.length - maxPreviewFields;
  const hasFile = entry.fields.hasUploadedFile && entry.fields.fileName;
  const intelligence = getEntryIntelligenceSignals(entry);
  const summary = intelligence.summary;
  const tags = intelligence.tags.slice(0, 3);
  const linkedCount = intelligence.linkedCount;
  const actionItemCount = intelligence.actionItemCount;
  const reminderLikeCount = intelligence.reminderLikeCount;
  const isEnriched = intelligence.isEnriched;
  const createdDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  if (variant === "compact") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
          "hover:shadow-md hover:border-primary/30 cursor-pointer",
          config.borderColor,
          className
        ),
        onClick: () => onView?.(entry),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("p-2 rounded-lg", config.bgColor), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CategoryIcon, { className: cn("w-4 h-4", config.color) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm truncate", children: entry.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: previewFields.map(([k, v]) => formatFieldValue$1(k, v)).filter(Boolean).join(" • ") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs shrink-0", children: createdDate })
        ]
      }
    );
  }
  if (variant === "list") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: cn(
          "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
          "hover:shadow-lg hover:border-primary/30",
          config.borderColor,
          className
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("p-3 rounded-xl shrink-0", config.bgColor), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CategoryIcon, { className: cn("w-6 h-6", config.color) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-lg", children: entry.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1 flex-wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: cn("text-xs", config.color, config.bgColor), children: category }),
                  isEnriched && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs border-primary/30 text-primary", children: "Smart" }),
                  actionItemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs", children: [
                    actionItemCount,
                    " action",
                    actionItemCount > 1 ? "s" : ""
                  ] }),
                  linkedCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs", children: [
                    linkedCount,
                    " linked"
                  ] }),
                  reminderLikeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs border-amber-300 text-amber-700", children: "Deadline" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                    createdDate
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "w-4 h-4" }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", children: [
                  onView && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onView(entry), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4 mr-2" }),
                    " View Details"
                  ] }),
                  onEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onEdit(entry), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "w-4 h-4 mr-2" }),
                    " Edit"
                  ] }),
                  onFill && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onFill(entry), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 mr-2" }),
                    " Fill Form"
                  ] }),
                  onUseAsTemplate && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onUseAsTemplate(entry), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4 mr-2" }),
                    " Use as Template"
                  ] }),
                  hasFile && onDownload && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onDownload(entry), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 mr-2" }),
                    " Download File"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => handlePrint(), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "w-4 h-4 mr-2" }),
                    " Print"
                  ] }),
                  onDelete && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      DropdownMenuItem,
                      {
                        onClick: () => onDelete(entry.id),
                        className: "text-red-600 focus:text-red-600",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                          " Delete"
                        ]
                      }
                    )
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid grid-cols-2 gap-2", children: previewFields.map(([key, value]) => {
              const FieldIcon = config.fieldIcons[key] || Tag;
              const formattedValue = formatFieldValue$1(key, value);
              if (!formattedValue) return null;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FieldIcon, { className: "w-3.5 h-3.5 text-muted-foreground shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                  formatFieldName(key),
                  ":"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium truncate", children: formattedValue })
              ] }, key);
            }) }),
            summary && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-3 line-clamp-2", children: summary }),
            tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, tag)) }),
            remainingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
              "+",
              remainingCount,
              " more field",
              remainingCount > 1 ? "s" : ""
            ] })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: cn(
        "group overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        "border-2",
        config.borderColor,
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("px-4 py-3 border-b", config.bgColor, config.borderColor), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
              "p-2.5 rounded-xl bg-background shadow-sm",
              "ring-2 ring-offset-1",
              config.borderColor
            ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CategoryIcon, { className: cn("w-5 h-5", config.color) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors", children: entry.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: "secondary",
                    className: cn("text-xs px-2 py-0", config.color, "bg-background"),
                    children: category
                  }
                ),
                isEnriched && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs px-2 py-0 border-primary/30 text-primary bg-background", children: "Smart" }),
                actionItemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs px-2 py-0 bg-background", children: [
                  actionItemCount,
                  " action",
                  actionItemCount > 1 ? "s" : ""
                ] }),
                reminderLikeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs px-2 py-0 bg-background border-amber-300 text-amber-700", children: "Deadline" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "w-4 h-4" })
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [
              onView && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onView(entry), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4 mr-2" }),
                " View Details"
              ] }),
              onEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onEdit(entry), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "w-4 h-4 mr-2" }),
                " Edit Entry"
              ] }),
              onFill && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onFill(entry), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 mr-2" }),
                " Fill Form"
              ] }),
              onUseAsTemplate && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onUseAsTemplate(entry), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4 mr-2" }),
                " Use as Template"
              ] }),
              hasFile && onDownload && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onDownload(entry), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 mr-2" }),
                " Download File"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => handlePrint(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "w-4 h-4 mr-2" }),
                " Print"
              ] }),
              onDelete && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  DropdownMenuItem,
                  {
                    onClick: () => onDelete(entry.id),
                    className: "text-red-600 focus:text-red-600 focus:bg-red-50",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                      " Delete"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: previewFields.map(([key, value]) => {
            const FieldIcon = config.fieldIcons[key] || Tag;
            const formattedValue = formatFieldValue$1(key, value);
            if (!formattedValue) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-start gap-2 text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FieldIcon, { className: cn("w-4 h-4 mt-0.5 shrink-0", config.color) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs uppercase tracking-wide", children: formatFieldName(key) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground line-clamp-2", children: formattedValue })
                  ] })
                ]
              },
              key
            );
          }) }),
          summary && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-3 line-clamp-2", children: summary }),
          tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, tag)) }),
          remainingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-3 pt-3 border-t", children: [
            "+",
            remainingCount,
            " more field",
            remainingCount > 1 ? "s" : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-4 pt-3 border-t", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: createdDate })
            ] }),
            hasFile && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-3 h-3" }),
              entry.fields.fileName
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity", children: [
            onView && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "flex-1 h-8",
                onClick: () => onView(entry),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-3.5 h-3.5 mr-1" }),
                  "View"
                ]
              }
            ),
            onEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "flex-1 h-8",
                onClick: () => onEdit(entry),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "w-3.5 h-3.5 mr-1" }),
                  "Edit"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "h-8 text-purple-600 hover:text-purple-700",
                onClick: handlePrint,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "w-3.5 h-3.5" })
              }
            )
          ] })
        ] })
      ]
    }
  );
};
const EnhancedEntryCard = React.memo(EnhancedEntryCardComponent, (prevProps, nextProps) => {
  return prevProps.entry.id === nextProps.entry.id && prevProps.entry.updatedAt === nextProps.entry.updatedAt && prevProps.variant === nextProps.variant && prevProps.className === nextProps.className;
});
const formatFieldValue = (key, value) => {
  if (value === null || value === void 0 || value === "") {
    return { formatted: "—", type: "text" };
  }
  if (key.toLowerCase().includes("size") && typeof value === "number") {
    if (value < 1024) return { formatted: `${value} B`, type: "text" };
    if (value < 1024 * 1024) return { formatted: `${(value / 1024).toFixed(1)} KB`, type: "text" };
    return { formatted: `${(value / (1024 * 1024)).toFixed(1)} MB`, type: "text" };
  }
  if (key.toLowerCase().includes("date") || key.toLowerCase().includes("expir") || key.toLowerCase().includes("appointment")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      return { formatted, type: "date" };
    }
  }
  if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("mobile") || key.toLowerCase().includes("tel")) {
    const cleaned = String(value).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return { formatted: `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`, type: "phone" };
    }
    if (cleaned.length === 11 && cleaned[0] === "1") {
      return { formatted: `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`, type: "phone" };
    }
    return { formatted: String(value), type: "phone" };
  }
  if (key.toLowerCase().includes("email")) {
    return { formatted: String(value), type: "email" };
  }
  if (key.toLowerCase().includes("url") || key.toLowerCase().includes("website") || key.toLowerCase().includes("link")) {
    return { formatted: String(value), type: "url" };
  }
  if (key.toLowerCase().includes("balance") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("price") || key.toLowerCase().includes("cost") || key.toLowerCase().includes("premium")) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
      return { formatted, type: "currency" };
    }
  }
  if (key.toLowerCase().includes("cardnumber") || key.toLowerCase().includes("accountnumber") || key.toLowerCase().includes("ssn") || key.toLowerCase().includes("social")) {
    const str = String(value).replace(/\s/g, "");
    if (str.length >= 4) {
      return { formatted: `${"•".repeat(str.length - 4)} ${str.slice(-4)}`, type: "masked" };
    }
  }
  return { formatted: String(value), type: "text" };
};
const EnhancedEntryViewDialog = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onFill,
  onUseAsTemplate,
  onViewDocument,
  onPrint,
  allEntries = [],
  onOpenRelatedEntry
}) => {
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const handleCloseCommand = () => {
      if (isOpen) {
        onClose();
      }
    };
    window.addEventListener("nova:close", handleCloseCommand);
    return () => {
      window.removeEventListener("nova:close", handleCloseCommand);
    };
  }, [isOpen, onClose]);
  if (!entry) return null;
  const category = entry.fields.category || "Personal";
  const config = getCategoryConfig(category);
  const CategoryIcon = config.icon;
  const entryImages = extractImagesFromEntry(entry);
  const isDocumentWithFile = entry.fields.category === "Documents" && entry.fields.hasUploadedFile;
  const hasFile = entry.fields.hasUploadedFile && entry.fields.fileName;
  const displayFields = Object.entries(entry.fields).filter(([key]) => !metadataFields.includes(key)).filter(([key, value]) => {
    if (entryImages.includes(String(value)) || Array.isArray(value) && value.some((v) => entryImages.includes(String(v)))) {
      return false;
    }
    return true;
  });
  const handleDownload = async () => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      Jt.error("No file available for download");
      return;
    }
    setIsDownloading(true);
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
      logError("Download error", error);
      Jt.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };
  const handlePrint = () => {
    if (onPrint) {
      onPrint(entry);
    } else {
      printProfessionally([entry], { title: entry.title, includeMetadata: true });
    }
    Jt.success("Print dialog opened");
  };
  const createdDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const updatedDate = new Date(entry.updatedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-hidden p-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
      "relative px-6 pt-6 pb-8 bg-gradient-to-br",
      config.gradientFrom,
      config.gradientTo
    ), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20",
          onClick: onClose,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 rounded-2xl bg-white/20 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CategoryIcon, { className: "w-8 h-8 text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-2xl font-bold text-white mb-2", children: entry.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-white/20 text-white border-0 backdrop-blur-sm", children: category }),
            hasFile && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-white/20 text-white border-0 backdrop-blur-sm gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-3 h-3" }),
              entry.fields.fileName
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-4 text-white/80 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Created ",
            createdDate
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Updated ",
            updatedDate
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-6 overflow-y-auto max-h-[calc(90vh-280px)]", children: [
      entryImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: [
          "Images (",
          entryImages.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ImageGallery, { images: entryImages, readOnly: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        EntryIntelligencePanel,
        {
          entry,
          allEntries,
          onOpenEntry: onOpenRelatedEntry
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4", children: "Entry Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: displayFields.map(([key, value]) => {
          if (typeof value === "object" && value !== null && "columns" in value && "rows" in value) {
            const tableData = value;
            const isShoppingList = tableData.columns.some(
              (col) => ["item", "quantity", "price", "cost", "purchased", "got it"].some(
                (term) => col.name.toLowerCase().includes(term)
              )
            );
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-semibold text-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cn("w-4 h-4", config.color) }),
                formatFieldName(key)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border overflow-hidden", children: isShoppingList ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                ShoppingListCardViewer,
                {
                  value: tableData,
                  title: key,
                  showExport: true
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                TableFieldViewer,
                {
                  value: tableData,
                  title: key,
                  showExport: true
                }
              ) })
            ] }, key);
          }
          const FieldIcon = config.fieldIcons[key] || Tag;
          const { formatted, type } = formatFieldValue(key, value);
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "group p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                  "p-2 rounded-lg",
                  "bg-muted group-hover:bg-background transition-colors"
                ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(FieldIcon, { className: cn("w-4 h-4", config.color) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: formatFieldName(key) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: type === "email" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: `mailto:${formatted}`,
                      className: "text-primary hover:underline flex items-center gap-1",
                      children: [
                        formatted,
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" })
                      ]
                    }
                  ) : type === "phone" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: `tel:${formatted.replace(/\D/g, "")}`,
                      className: "text-primary hover:underline flex items-center gap-1",
                      children: [
                        formatted,
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-3 h-3" })
                      ]
                    }
                  ) : type === "url" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: formatted.startsWith("http") ? formatted : `https://${formatted}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "text-primary hover:underline flex items-center gap-1",
                      children: [
                        formatted,
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" })
                      ]
                    }
                  ) : type === "currency" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-semibold text-green-600 dark:text-green-400", children: formatted }) : type === "masked" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-muted-foreground", children: formatted }) : type === "date" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4 text-muted-foreground" }),
                    formatted
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground whitespace-pre-wrap", children: formatted }) })
                ] })
              ] })
            },
            key
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-4 border-t bg-muted/30 flex flex-wrap gap-2 justify-end", children: [
      isDocumentWithFile && onViewDocument && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => {
            onViewDocument(entry);
            onClose();
          },
          variant: "outline",
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
            "View Document"
          ]
        }
      ),
      hasFile && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleDownload,
          variant: "outline",
          disabled: isDownloading,
          className: "gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
            isDownloading ? "Downloading..." : "Download"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handlePrint,
          variant: "outline",
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4 w-4" }),
            "Print"
          ]
        }
      ),
      onFill && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => {
            onFill(entry);
            onClose();
          },
          variant: "outline",
          className: "gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
            "Fill Form"
          ]
        }
      ),
      onUseAsTemplate && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => {
            onUseAsTemplate(entry);
            onClose();
          },
          variant: "outline",
          className: "gap-2 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" }),
            "Use as Template"
          ]
        }
      ),
      onEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => {
            onEdit(entry);
            onClose();
          },
          className: cn("gap-2 bg-gradient-to-r", config.gradientFrom, config.gradientTo, "text-white hover:opacity-90"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4" }),
            "Edit Entry"
          ]
        }
      )
    ] })
  ] }) });
};
const EnhancedRecentEntries = React.memo(({
  entries,
  onEdit,
  onFill,
  onUseAsTemplate,
  onDelete,
  onView,
  onViewAll,
  maxEntries = 5,
  title = "Recent Entries",
  showViewToggle = true
}) => {
  const [viewingEntry, setViewingEntry] = reactExports.useState(null);
  const [viewMode, setViewMode] = reactExports.useState("list");
  useNavigate();
  const recentEntries = reactExports.useMemo(() => entries.slice(0, maxEntries), [entries, maxEntries]);
  const handleEntryClick = (entry) => {
    setViewingEntry(entry);
  };
  const handleCloseDialog = () => {
    setViewingEntry(null);
  };
  const handleDownload = async (entry) => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      Jt.error("No file available for download");
      return;
    }
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
        Jt.error("File data not found");
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
    }
  };
  const handlePrintAll = () => {
    if (recentEntries.length === 0) {
      Jt.error("No entries to print");
      return;
    }
    printProfessionally(recentEntries, {
      title: "Recent Entries",
      includeMetadata: true
    });
    Jt.success("Print dialog opened");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden border-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-gradient-to-r from-primary/5 to-primary/10 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-xl", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: entries.length === 0 ? "No entries yet" : `${entries.length} total • Showing ${recentEntries.length}` })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          showViewToggle && recentEntries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center bg-muted rounded-lg p-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: viewMode === "list" ? "secondary" : "ghost",
                size: "sm",
                className: "h-7 px-2",
                onClick: () => setViewMode("list"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: viewMode === "grid" ? "secondary" : "ghost",
                size: "sm",
                className: "h-7 px-2",
                onClick: () => setViewMode("grid"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid3x3, { className: "w-4 h-4" })
              }
            )
          ] }),
          recentEntries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handlePrintAll,
              className: "gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Print" })
              ]
            }
          ),
          onViewAll && entries.length > maxEntries && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: onViewAll,
              size: "sm",
              className: "gap-1",
              children: [
                "View All",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        recentEntries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-8 h-8 text-muted-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-lg mb-2", children: "No entries yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm max-w-sm mx-auto", children: "Start adding entries to keep track of your important information. Use voice commands or the Add Entry button to get started." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: cn(
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"
            ),
            children: recentEntries.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              EnhancedEntryCard,
              {
                entry,
                variant: viewMode === "grid" ? "grid" : viewMode === "compact" ? "compact" : "list",
                onView: handleEntryClick,
                onEdit,
                onDelete,
                onFill,
                onUseAsTemplate,
                onDownload: handleDownload
              },
              entry.id
            ))
          }
        ),
        entries.length > maxEntries && onViewAll && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 pt-4 border-t text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            onClick: onViewAll,
            className: "text-muted-foreground hover:text-foreground",
            children: [
              "+",
              entries.length - maxEntries,
              " more entries",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4 ml-2" })
            ]
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EnhancedEntryViewDialog,
      {
        entry: viewingEntry,
        isOpen: !!viewingEntry,
        onClose: handleCloseDialog,
        onEdit,
        onFill,
        onUseAsTemplate,
        onViewDocument: onView,
        allEntries: entries,
        onOpenRelatedEntry: (entry) => setViewingEntry(entry)
      }
    )
  ] });
});
EnhancedRecentEntries.displayName = "EnhancedRecentEntries";
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
const calculateDatabaseStorageSize = (entries) => {
  let totalSize = 0;
  entries.forEach((entry) => {
    const entryData = {
      id: entry.id,
      title: entry.title,
      fields: entry.fields,
      field_definitions: entry.field_definitions,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      user_id: entry.user_id
    };
    const entryString = JSON.stringify(entryData);
    totalSize += entryString.length * 2;
    if (entry.fields) {
      Object.values(entry.fields).forEach((value) => {
        if (typeof value === "string") {
          totalSize += value.length * 2;
        }
      });
    }
  });
  return totalSize;
};
const calculateLocalStorageSize = () => {
  let totalSize = 0;
  const relevantKeys = ["firebase:authUser", "ui-theme", "savedEntries"];
  relevantKeys.forEach((key) => {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += (item.length + key.length) * 2;
    }
  });
  return totalSize;
};
const getStorageLimit = (userTier = "free") => {
  const limits = {
    free: 500 * 1024 * 1024,
    // 500 MB
    basic: 5 * 1024 * 1024 * 1024,
    // 5 GB  
    premium: 50 * 1024 * 1024 * 1024,
    // 50 GB
    enterprise: 500 * 1024 * 1024 * 1024
    // 500 GB
  };
  return limits[userTier] || limits.free;
};
const calculateStoragePercentage = (used, limit2) => {
  return Math.round(used / limit2 * 100);
};
const getRecentActivityCount = (entries) => {
  const oneWeekAgo = /* @__PURE__ */ new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= oneWeekAgo;
  }).length;
};
const isValidTier = (tier) => ["free", "basic", "premium", "enterprise"].includes(tier);
const useStorageStats = (entries, userTier) => {
  const [serverUsage, setServerUsage] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (isMounted) setServerUsage(null);
          return;
        }
        const usageRef = doc(db, "storage_usage", user.uid);
        const usageSnap = await getDoc(usageRef);
        if (usageSnap.exists()) {
          const data = usageSnap.data();
          if (isMounted) {
            setServerUsage({
              user_id: user.uid,
              tier: data.tier || "free",
              limit_bytes: data.limit_bytes || getStorageLimit("free"),
              db_bytes_used: data.db_bytes_used || 0,
              file_bytes_used: data.file_bytes_used || 0,
              total_bytes: data.total_bytes || 0,
              updated_at: data.updated_at || (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        } else {
          if (isMounted) setServerUsage(null);
        }
      } catch (e) {
        console.warn("Failed to fetch storage usage:", e);
        if (isMounted) setServerUsage(null);
      }
    };
    fetchUsage();
    return () => {
      isMounted = false;
    };
  }, [entries.length, userTier]);
  return reactExports.useMemo(() => {
    const localStorageUsed = calculateLocalStorageSize();
    const estimatedDbUsed = calculateDatabaseStorageSize(entries);
    const normalizedTier = isValidTier((userTier || "free").toLowerCase()) ? (userTier || "free").toLowerCase() : "free";
    const fallbackLimit = getStorageLimit(normalizedTier);
    const dbUsed = serverUsage?.db_bytes_used ?? estimatedDbUsed;
    const fileUsed = serverUsage?.file_bytes_used ?? 0;
    const serverTotal = serverUsage?.total_bytes ?? dbUsed + fileUsed;
    const limit2 = serverUsage?.limit_bytes ?? fallbackLimit;
    const totalUsed = serverTotal;
    const percentage = calculateStoragePercentage(totalUsed, limit2);
    const available = Math.max(0, limit2 - totalUsed);
    return {
      totalUsed,
      totalUsedFormatted: formatBytes(totalUsed),
      localStorageUsed,
      databaseUsed: dbUsed + fileUsed,
      limit: limit2,
      limitFormatted: formatBytes(limit2),
      percentage,
      availableFormatted: formatBytes(available)
    };
  }, [entries, userTier, serverUsage]);
};
const StatsCards = ({ totalEntries, entries, userTier = "free" }) => {
  const storageStats = useStorageStats(entries, userTier);
  const recentActivityCount = getRecentActivityCount(entries);
  React.useEffect(() => {
    try {
      const pct = storageStats.percentage;
      if (pct >= 90) {
        const key = "quotaWarnedAt";
        const lastShown = Number(localStorage.getItem(key) || "0");
        const bucket = Math.floor(pct / 5) * 5;
        if (bucket > lastShown) {
          toast({
            title: "Storage nearly full",
            description: `You're using ${storageStats.totalUsedFormatted} of ${storageStats.limitFormatted} (${pct}%). Consider cleaning up or upgrading.`
          });
          localStorage.setItem(key, String(bucket));
        }
      }
    } catch (e) {
    }
  }, [storageStats.percentage, storageStats.totalUsedFormatted, storageStats.limitFormatted]);
  const stats = [
    {
      id: "0x001",
      title: "TOTAL_ENTRIES",
      value: totalEntries.toString(),
      subtitle: "RECORDS_IN_ARCHIVE",
      icon: FileText
    },
    {
      id: "0x002",
      title: "CATEGORIES",
      value: "5",
      subtitle: "ORGANIZED_COLLECTIONS",
      icon: FolderOpen
    },
    {
      id: "0x003",
      title: "STORAGE_USED",
      value: storageStats.totalUsedFormatted,
      subtitle: `OF ${storageStats.limitFormatted} AVAILABLE`,
      icon: HardDrive,
      showProgress: true,
      progress: storageStats.percentage
    },
    {
      id: "0x004",
      title: "RECENT_ACTIVITY",
      value: recentActivityCount.toString(),
      subtitle: "ENTRIES_THIS_WEEK",
      icon: Activity
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: stats.map((stat, index) => {
    const Icon = stat.icon;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "skeleton-cell group cursor-pointer reveal",
        "data-id": stat.id,
        style: { animationDelay: `${index * 100}ms` },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mono text-xs text-muted-foreground mb-2 tracking-wider", children: stat.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mono text-2xl md:text-3xl font-bold text-primary mb-1 group-hover:animate-pulse", children: stat.value }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mono text-xs text-muted-foreground", children: stat.subtitle }),
            stat.showProgress && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 bg-zinc-800 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-primary transition-all duration-500",
                  style: { width: `${stat.progress}%` }
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mono text-xs text-muted-foreground mt-1", children: [
                stat.progress,
                "%"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 border border-galvanized flex items-center justify-center shrink-0 group-hover:border-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 text-primary" }) })
        ] })
      },
      stat.id
    );
  }) });
};
const NewQuickActions = ({
  onAddEntry,
  onCreateDocument,
  entries,
  searchQuery,
  onSearchChange,
  onEntrySelect
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-4 md:p-6 mb-6 md:mb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2", children: "Quick Actions" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs md:text-sm mb-3 md:mb-4", children: "Get started with these common tasks" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 sm:gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => {
              console.log("Add Entry button clicked");
              onAddEntry();
            },
            className: "flex items-center space-x-2 flex-1 sm:flex-none min-w-[120px]",
            size: "sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Add Entry" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => {
              console.log("Create Document button clicked");
              onCreateDocument();
            },
            variant: "outline",
            className: "flex items-center space-x-2 flex-1 sm:flex-none min-w-[120px]",
            size: "sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden xs:inline", children: "Create " }),
              "Doc"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full sm:min-w-[200px] sm:flex-1 order-first sm:order-none mb-3 sm:mb-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        SmartSearchWithBoundary,
        {
          entries,
          searchQuery,
          onSearchChange,
          onEntrySelect,
          placeholder: "Search entries..."
        }
      ) })
    ] })
  ] });
};
const parseActionItemText = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "text" in item) {
        return String(item.text || "").trim();
      }
      return "";
    }).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/\n|•/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
};
const DashboardIntelligencePanel = ({ entries }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = reactExports.useState([]);
  const [linkedCount, setLinkedCount] = reactExports.useState(0);
  const [memoryCount, setMemoryCount] = reactExports.useState(0);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const actionItems = reactExports.useMemo(() => {
    return entries.flatMap((entry) => {
      const extracted = parseActionItemText(entry.action_items);
      const fieldBased = parseActionItemText(entry.fields?.actionItems);
      const combined = [...extracted, ...fieldBased].filter(Boolean);
      return combined.map((text) => ({ entryId: entry.id, entryTitle: entry.title, text }));
    }).slice(0, 6);
  }, [entries]);
  const recentIntelligence = reactExports.useMemo(() => {
    return entries.filter((entry) => {
      const summary = entry.summary;
      const linked = entry.linked_entries;
      const tags = entry.tags;
      return Boolean(summary || linked && linked.length || tags && tags.length);
    }).slice(0, 3);
  }, [entries]);
  const briefingLines = reactExports.useMemo(() => {
    const lines = [];
    if (reminders.length > 0) {
      lines.push(`${reminders.length} active reminder${reminders.length > 1 ? "s" : ""} need attention.`);
    }
    if (actionItems.length > 0) {
      lines.push(`${actionItems.length} extracted action item${actionItems.length > 1 ? "s" : ""} surfaced from recent entries.`);
    }
    if (recentIntelligence.length > 0) {
      lines.push(`${recentIntelligence.length} enriched entr${recentIntelligence.length > 1 ? "ies are" : "y is"} ready for follow-up.`);
    }
    if (memoryCount > 0) {
      lines.push(`Nova is carrying ${memoryCount} active memor${memoryCount === 1 ? "y" : "ies"} for continuity.`);
    }
    if (lines.length === 0) {
      lines.push("The intelligence layer is warming up. Save more context and Nova will start surfacing stronger signals.");
    }
    return lines.slice(0, 3);
  }, [reminders, actionItems, recentIntelligence, memoryCount]);
  const openEntry = (entryId) => {
    if (!entryId) return;
    navigate(`/all-entries/${entryId}`);
  };
  reactExports.useEffect(() => {
    const loadIntelligence = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [remindersSnap, linksSnap, memoriesSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "reminders"),
              where("user_id", "==", user.uid),
              where("status", "in", ["pending", "scheduled"]),
              orderBy("remind_at", "asc"),
              limit(5)
            )
          ).catch(() => ({ docs: [] })),
          getDocs(
            query(
              collection(db, "entry_links"),
              where("user_id", "==", user.uid),
              limit(20)
            )
          ).catch(() => ({ docs: [] })),
          getDocs(
            query(
              collection(db, "nova_memories"),
              where("user_id", "==", user.uid),
              where("active", "==", true),
              limit(50)
            )
          ).catch(() => ({ docs: [] }))
        ]);
        const loadedReminders = remindersSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            text: String(data.text || data.title || "Reminder"),
            remind_at: data.remind_at?.toDate?.() || null,
            status: data.status,
            entry_id: data.entry_id || data.entryId || null
          };
        });
        const loadedLinks = linksSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            target_entry_id: data.target_entry_id,
            score: data.score
          };
        });
        const loadedMemories = memoriesSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            content: String(data.content || ""),
            category: data.category || null
          };
        });
        setReminders(loadedReminders);
        setLinkedCount(loadedLinks.length);
        setMemoryCount(loadedMemories.length);
      } finally {
        setIsLoading(false);
      }
    };
    loadIntelligence();
  }, [user, entries.length]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Radar, { className: "w-5 h-5 text-primary" }),
        "Daily Briefing"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-2", children: briefingLines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground", children: line }, index)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-5 h-5 text-primary" }),
          "Intelligence Layer"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "What Nova knows, what needs attention, and what is connected." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate("/briefing"), children: [
          "Open Briefing",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate("/insights"), children: [
          "Open Insights",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "w-4 h-4 text-amber-500" }),
          "Upcoming Reminders"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading reminders…" }) : reminders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No active reminders yet." }) : reminders.map((reminder) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
            onClick: () => openEntry(reminder.entry_id),
            disabled: !reminder.entry_id,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: reminder.text }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: reminder.remind_at ? reminder.remind_at.toLocaleString() : "Scheduled" })
            ]
          },
          reminder.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SquareCheckBig, { className: "w-4 h-4 text-green-500" }),
          "Extracted Action Items"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: actionItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No extracted action items yet." }) : actionItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
            onClick: () => openEntry(item.entryId),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: item.text }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                "From: ",
                item.entryTitle
              ] })
            ]
          },
          `${item.entryId}-${index}`
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "w-4 h-4 text-primary" }),
          "Nova Memory & Connections"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
              onClick: () => navigate("/settings?tab=nova-memory"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Memories Stored" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Personal facts Nova can recall" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: memoryCount })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Linked Entry Graph" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Known relationships between entries" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: linkedCount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: recentIntelligence.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No enriched entries surfaced yet." }) : recentIntelligence.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
              onClick: () => openEntry(entry.id),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "w-3.5 h-3.5 text-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: entry.title })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-2", children: entry.summary || "Enriched entry ready for deeper intelligence surfaces." })
              ]
            },
            entry.id
          )) })
        ] })
      ] })
    ] })
  ] });
};
const categories = [
  { name: "Documents", icon: FileText, description: "Official papers, certificates, contracts" },
  { name: "Health", icon: Heart, description: "Medical records, prescriptions, appointments" },
  { name: "Contacts", icon: Users, description: "People, businesses, emergency contacts" },
  { name: "Finance", icon: DollarSign, description: "Bank info, investments, insurance" },
  { name: "Personal", icon: User, description: "Personal notes, memories, goals" }
];
const CategoriesGrid = React.memo(({
  categories: categories2,
  savedEntries,
  onCategorySelect
}) => {
  const categoryCounts = reactExports.useMemo(() => {
    const counts = {};
    for (const entry of savedEntries) {
      const cat = entry.fields.category || "Personal";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [savedEntries]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-6", children: "Browse by Category" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4", children: categories2.map((category, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "p-6 rounded-xl border cursor-pointer group reveal transition-all hover:shadow-lg",
        onClick: () => onCategorySelect(category.name),
        style: { animationDelay: `${index * 50}ms` },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(category.icon, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground mb-1", children: category.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3 line-clamp-2 hidden sm:block", children: category.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground", children: [
            categoryCounts[category.name] || 0,
            " ",
            (categoryCounts[category.name] || 0) === 1 ? "item" : "items"
          ] })
        ]
      },
      category.name
    )) })
  ] });
});
CategoriesGrid.displayName = "CategoriesGrid";
const DashboardMainContent = ({
  userName,
  userTier,
  savedEntries,
  searchQuery,
  onSearchChange,
  showDocumentCreator,
  showAddEntry,
  editingEntry,
  fillingEntry,
  getFormTitle,
  getFormMode,
  onDocumentSave,
  onDocumentCancel,
  onSaveEntry,
  onCancelEdit,
  onCategorySelect,
  onAddEntry,
  onCreateDocument,
  onEditEntry,
  onFillEntry,
  onUseAsTemplate,
  onDeleteEntry,
  onViewAllEntries,
  isSaving,
  onViewDocument
}) => {
  if (showDocumentCreator) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DocumentCreator$1,
      {
        onSave: onDocumentSave,
        onCancel: onDocumentCancel
      }
    );
  }
  if (showAddEntry || editingEntry || fillingEntry) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DataEntryForm,
      {
        mode: getFormMode(),
        editEntry: editingEntry,
        templateEntry: fillingEntry,
        onSave: onSaveEntry,
        onCancel: onCancelEdit,
        isSaving
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center reveal", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl md:text-4xl font-bold mb-3", children: [
        "Welcome back",
        userName ? `, ${userName.split(" ")[0]}` : ""
      ] }),
      userTier && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20", children: [
        userTier,
        " Plan"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-3", children: "Your secure knowledge vault — all data encrypted" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      NewQuickActions,
      {
        onAddEntry,
        onCreateDocument,
        entries: savedEntries,
        searchQuery,
        onSearchChange,
        onEntrySelect: onViewDocument
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      StatsCards,
      {
        totalEntries: savedEntries.length,
        entries: savedEntries,
        userTier
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardIntelligencePanel, { entries: savedEntries }),
    savedEntries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl border bg-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-foreground", children: "View All Entries" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Browse and manage your saved data" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20", children: [
            savedEntries.length,
            " ",
            savedEntries.length === 1 ? "record" : "records"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: onViewAllEntries,
              className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Table, { className: "w-4 h-4" }),
                "Open Table View"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:flex items-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Grid3x3, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sortable" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Bulk Actions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Export" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CategoriesGrid,
      {
        categories,
        savedEntries,
        onCategorySelect
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EnhancedRecentEntries,
      {
        entries: savedEntries,
        maxEntries: 6,
        onEdit: onEditEntry,
        onFill: onFillEntry,
        onUseAsTemplate,
        onDelete: onDeleteEntry,
        onView: onViewDocument,
        onViewAll: onViewAllEntries,
        title: "Recent Entries",
        showViewToggle: true
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl border bg-card text-center reveal transition-all hover:shadow-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground mb-2", children: "Secure Storage" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Your data is encrypted and stored securely" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl border bg-card text-center reveal transition-all hover:shadow-lg", style: { animationDelay: "100ms" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground mb-2", children: "Quick Access" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Find what you need instantly with powerful search" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl border bg-card text-center reveal transition-all hover:shadow-lg", style: { animationDelay: "200ms" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground mb-2", children: "Smart Features" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Voice commands, templates, and auto organization" })
      ] })
    ] })
  ] });
};
class ErrorTracker {
  logs = [];
  maxLogs = 1e3;
  isEnabled = true;
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
  logError(type, message, context, error) {
    if (!this.isEnabled) return;
    const errorLog = {
      timestamp: Date.now(),
      type,
      level: "error",
      message,
      context,
      stack: error?.stack
    };
    this.addLog(errorLog);
  }
  logWarning(type, message, context) {
    if (!this.isEnabled) return;
    const warningLog = {
      timestamp: Date.now(),
      type,
      level: "warning",
      message,
      context
    };
    this.addLog(warningLog);
  }
  logInfo(type, message, context) {
    if (!this.isEnabled) return;
    const infoLog = {
      timestamp: Date.now(),
      type,
      level: "info",
      message,
      context
    };
    this.addLog(infoLog);
  }
  addLog(log) {
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
  getLogs(type, level) {
    let filteredLogs = this.logs;
    if (type) {
      filteredLogs = filteredLogs.filter((log) => log.type === type);
    }
    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }
    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  }
  getStats() {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1e3;
    const recent = this.logs.filter((log) => log.timestamp > last24Hours);
    return {
      total: this.logs.length,
      last24Hours: recent.length,
      byType: {
        voice: recent.filter((log) => log.type === "voice").length,
        form: recent.filter((log) => log.type === "form").length,
        api: recent.filter((log) => log.type === "api").length,
        ui: recent.filter((log) => log.type === "ui").length
      },
      byLevel: {
        error: recent.filter((log) => log.level === "error").length,
        warning: recent.filter((log) => log.level === "warning").length,
        info: recent.filter((log) => log.level === "info").length
      }
    };
  }
  clear() {
    this.logs = [];
  }
  exportLogs() {
    return JSON.stringify({
      logs: this.logs,
      stats: this.getStats(),
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2);
  }
}
const errorTracker = new ErrorTracker();
class VoiceErrorBoundary extends reactExports.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    errorTracker.logError("ui", "Voice component error boundary triggered", {
      errorInfo: errorInfo.componentStack,
      error: error.message
    }, error);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-destructive", children: "Voice System Error" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Something went wrong with the voice system. This is usually a temporary issue." }),
          this.state.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded text-xs font-mono", children: this.state.error.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: this.handleReset,
                children: "Try Again"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => window.location.reload(),
                children: "Reload Page"
              }
            )
          ] })
        ] })
      ] });
    }
    return this.props.children;
  }
}
const DocumentCreator = reactExports.lazy(
  () => __vitePreload(() => import("./DocumentCreator-J_vwXBYC.js").then((n) => n.a), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]) : void 0).then((module) => ({ default: module.DocumentCreator }))
);
const EnhancedDocumentViewer = reactExports.lazy(
  () => __vitePreload(() => import("./EnhancedDocumentViewer-B2_epvOL.js"), true ? __vite__mapDeps([31,1,17,2,3,4,5,32,11,12,13,10,6,14,15,16,18,19,20,21,22,23,24,7,9,8,25,26,27,33]) : void 0).then((module) => ({ default: module.EnhancedDocumentViewer }))
);
const DocumentEditor = reactExports.lazy(
  () => __vitePreload(() => import("./DocumentEditor-BLa1e3Ta.js"), true ? __vite__mapDeps([34,2,1,3,4,5,17,8,11,12,13,10,6,14,15,16,18,19,20,21,22,23,24,7,9,25,26,27,30]) : void 0).then((module) => ({ default: module.DocumentEditor }))
);
function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = reactExports.useState("All");
  const [showDocumentCreator, setShowDocumentCreator] = reactExports.useState(false);
  const [documentViewerState, setDocumentViewerState] = reactExports.useState({ isOpen: false, entry: null });
  const [documentEditorState, setDocumentEditorState] = reactExports.useState({ isOpen: false, entry: null });
  const [deleteDialog, setDeleteDialog] = reactExports.useState({
    isOpen: false,
    entry: null,
    onConfirm: () => {
    }
  });
  const {
    savedEntries,
    isSaving,
    searchQuery,
    setSearchQuery,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    templateEntry,
    setTemplateEntry,
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    useAsTemplate,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    refreshEntries
  } = useDashboard();
  reactExports.useEffect(() => {
    if (authLoading || !user) return;
    const checkOnboarding = async () => {
      try {
        const prefsRef = doc(db, "user_preferences", user.uid);
        const prefsSnap = await getDoc(prefsRef);
        if (!prefsSnap.exists()) {
          navigate("/onboarding");
        }
      } catch (error) {
        console.log("Could not fetch preferences:", error);
      }
    };
    checkOnboarding();
  }, [authLoading, user, navigate]);
  reactExports.useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleAddEntry();
    }
  }, [searchParams, handleAddEntry]);
  reactExports.useEffect(() => {
    const requestedCategory = searchParams.get("category");
    if (!requestedCategory) return;
    setSelectedCategory(requestedCategory);
    setTemplateEntry(null);
    setFillingEntry(null);
    setEditingEntry(null);
    setShowAddEntry(true);
  }, [searchParams, setTemplateEntry, setFillingEntry, setEditingEntry, setShowAddEntry]);
  reactExports.useEffect(() => {
    const handleCloseFormCommand = () => {
      if (showAddEntry || editingEntry || fillingEntry || templateEntry || showDocumentCreator) {
        console.log("🎤 Voice command: Closing entry form");
        handleCancelEdit();
        setShowDocumentCreator(false);
      }
    };
    const handleDeleteConfirmation = (event) => {
      setDeleteDialog({
        isOpen: true,
        entry: event.detail.entry,
        onConfirm: event.detail.onConfirm
      });
    };
    window.addEventListener("close-entry-form", handleCloseFormCommand);
    window.addEventListener("nova:close", handleCloseFormCommand);
    window.addEventListener("show-delete-confirmation", handleDeleteConfirmation);
    return () => {
      window.removeEventListener("close-entry-form", handleCloseFormCommand);
      window.removeEventListener("nova:close", handleCloseFormCommand);
      window.removeEventListener("show-delete-confirmation", handleDeleteConfirmation);
    };
  }, [showAddEntry, editingEntry, fillingEntry, templateEntry, showDocumentCreator, handleCancelEdit]);
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };
  const handleAllEntriesSelect = () => {
    navigate("/all-entries");
  };
  const handleViewAllEntries = () => {
    navigate("/all-entries");
  };
  const handleCreateDocument = () => {
    console.log("📄 Dashboard: Create document triggered");
    setShowDocumentCreator(true);
  };
  const handleDocumentSave = (entry) => {
    console.log("📄 Dashboard: Document save triggered");
    saveEntry(entry);
    setShowDocumentCreator(false);
  };
  const handleDocumentCancel = () => {
    console.log("📄 Dashboard: Document creation cancelled");
    setShowDocumentCreator(false);
  };
  const handleViewDocument = (entry) => {
    console.log("📄 Dashboard: View document triggered for:", entry.title);
    const fileName = String(entry.fields.fileName || "").toLowerCase();
    const fileType = String(entry.fields.fileType || "").toLowerCase();
    const hasInline = Boolean(entry.fields?.documentContent);
    const isTextBased = hasInline || fileName.endsWith(".txt") || fileName.endsWith(".html") || fileName.endsWith(".htm") || fileType.includes("text/plain") || fileType.includes("text/html");
    if (isTextBased) {
      setDocumentEditorState({ isOpen: true, entry });
    } else {
      setDocumentViewerState({ isOpen: true, entry });
    }
  };
  const handleCloseDocumentViewer = () => {
    setDocumentViewerState({ isOpen: false, entry: null });
  };
  const handleOpenRelatedEntry = (entry) => {
    setDocumentViewerState({ isOpen: false, entry: null });
    navigate(`/all-entries/${entry.id}`);
  };
  const handleEditDocument = (entry) => {
    console.log("📝 Dashboard: Edit document triggered for:", entry.title);
    setDocumentViewerState({ isOpen: false, entry: null });
    setDocumentEditorState({ isOpen: true, entry });
  };
  const handleCloseDocumentEditor = () => {
    setDocumentEditorState({ isOpen: false, entry: null });
  };
  const handleDocumentSaved = (updatedEntry) => {
    Jt.success("Document updated successfully!");
    refreshEntries?.();
    setDocumentEditorState({ isOpen: false, entry: null });
  };
  const userName = user?.displayName || user?.email || "User";
  if (authLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: "Loading..." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DashboardLayout,
    {
      searchQuery,
      onSearchChange: setSearchQuery,
      userName,
      savedEntries,
      onAddEntry: handleAddEntry,
      onCategorySelect: handleCategorySelect,
      onAllEntriesSelect: handleAllEntriesSelect,
      onEditEntry: editEntry,
      onDeleteEntry: deleteEntry,
      onSaveEntry: saveEntry,
      onCancelEdit: handleCancelEdit,
      onFillEntry: fillEntry,
      onUseAsTemplate: useAsTemplate,
      children: [
        showAddEntry || editingEntry || fillingEntry || templateEntry || showDocumentCreator ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: showDocumentCreator ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-sm text-muted-foreground", children: "Loading document tools…" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DocumentCreator,
          {
            onSave: handleDocumentSave,
            onCancel: handleDocumentCancel
          }
        ) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DataEntryForm,
          {
            mode: getFormMode(),
            editEntry: editingEntry || fillingEntry,
            templateEntry,
            onSave: saveEntry,
            onCancel: handleCancelEdit,
            isVoiceActive: false,
            isSaving
          }
        ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DashboardMainContent,
          {
            userName,
            savedEntries,
            searchQuery,
            onSearchChange: setSearchQuery,
            showDocumentCreator,
            showAddEntry,
            editingEntry,
            fillingEntry,
            getFormTitle,
            getFormMode,
            onDocumentSave: handleDocumentSave,
            onDocumentCancel: handleDocumentCancel,
            onSaveEntry: saveEntry,
            onCancelEdit: handleCancelEdit,
            onCategorySelect: handleCategorySelect,
            onAddEntry: handleAddEntry,
            onCreateDocument: handleCreateDocument,
            onEditEntry: editEntry,
            onFillEntry: fillEntry,
            onUseAsTemplate: useAsTemplate,
            onDeleteEntry: deleteEntry,
            onViewDocument: handleViewDocument,
            onViewAllEntries: handleViewAllEntries,
            isSaving
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Suspense, { fallback: null, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            EnhancedDocumentViewer,
            {
              isOpen: documentViewerState.isOpen,
              onClose: handleCloseDocumentViewer,
              entry: documentViewerState.entry,
              onEdit: handleEditDocument,
              allEntries: savedEntries,
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
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DeleteConfirmDialog,
          {
            isOpen: deleteDialog.isOpen,
            onClose: () => setDeleteDialog((prev) => ({ ...prev, isOpen: false })),
            onConfirm: () => {
              deleteDialog.onConfirm();
              setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
            },
            title: deleteDialog.entry?.title || ""
          }
        )
      ]
    }
  ) });
}
export {
  Dashboard as default
};
