import { a as reactExports, d as useControllableState, j as jsxRuntimeExports, P as Primitive, a2 as useId, f as composeEventHandlers, e as Presence, u as useComposedRefs, o as useLayoutEffect2, m as createContextScope } from "./vendor-ui-CLSr_GWM.js";
import { c as createLucideIcon, B as Button, a as Link, C as Card, e as CardHeader, A as Search, h as CardContent, f as CardTitle, F as FileText, M as Mic, m as Brain, T as Tag } from "./index-CT7EzYyk.js";
import { I as Input } from "./input-B1KmmYia.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { A as ArrowLeft } from "./arrow-left-CCcLkmU5.js";
import { C as ChevronRight } from "./chevron-right-fa0SEsLi.js";
import { Z as Zap } from "./zap-CZIUQ85z.js";
import { U as Upload } from "./upload-B7xhnkmR.js";
import { S as Settings } from "./settings-B0Fe-YOB.js";
import { M as MessageSquare } from "./message-square-DXSTRoRr.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
const Filter = createLucideIcon("Filter", [
  ["polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3", key: "1yg77f" }]
]);
var COLLAPSIBLE_NAME = "Collapsible";
var [createCollapsibleContext] = createContextScope(COLLAPSIBLE_NAME);
var [CollapsibleProvider, useCollapsibleContext] = createCollapsibleContext(COLLAPSIBLE_NAME);
var Collapsible$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeCollapsible,
      open: openProp,
      defaultOpen,
      disabled,
      onOpenChange,
      ...collapsibleProps
    } = props;
    const [open = false, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen,
      onChange: onOpenChange
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      CollapsibleProvider,
      {
        scope: __scopeCollapsible,
        disabled,
        contentId: useId(),
        open,
        onOpenToggle: reactExports.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            "data-state": getState(open),
            "data-disabled": disabled ? "" : void 0,
            ...collapsibleProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
Collapsible$1.displayName = COLLAPSIBLE_NAME;
var TRIGGER_NAME = "CollapsibleTrigger";
var CollapsibleTrigger$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeCollapsible, ...triggerProps } = props;
    const context = useCollapsibleContext(TRIGGER_NAME, __scopeCollapsible);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        "aria-controls": context.contentId,
        "aria-expanded": context.open || false,
        "data-state": getState(context.open),
        "data-disabled": context.disabled ? "" : void 0,
        disabled: context.disabled,
        ...triggerProps,
        ref: forwardedRef,
        onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
      }
    );
  }
);
CollapsibleTrigger$1.displayName = TRIGGER_NAME;
var CONTENT_NAME = "CollapsibleContent";
var CollapsibleContent$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { forceMount, ...contentProps } = props;
    const context = useCollapsibleContext(CONTENT_NAME, props.__scopeCollapsible);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: ({ present }) => /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContentImpl, { ...contentProps, ref: forwardedRef, present }) });
  }
);
CollapsibleContent$1.displayName = CONTENT_NAME;
var CollapsibleContentImpl = reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeCollapsible, present, children, ...contentProps } = props;
  const context = useCollapsibleContext(CONTENT_NAME, __scopeCollapsible);
  const [isPresent, setIsPresent] = reactExports.useState(present);
  const ref = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const heightRef = reactExports.useRef(0);
  const height = heightRef.current;
  const widthRef = reactExports.useRef(0);
  const width = widthRef.current;
  const isOpen = context.open || isPresent;
  const isMountAnimationPreventedRef = reactExports.useRef(isOpen);
  const originalStylesRef = reactExports.useRef();
  reactExports.useEffect(() => {
    const rAF = requestAnimationFrame(() => isMountAnimationPreventedRef.current = false);
    return () => cancelAnimationFrame(rAF);
  }, []);
  useLayoutEffect2(() => {
    const node = ref.current;
    if (node) {
      originalStylesRef.current = originalStylesRef.current || {
        transitionDuration: node.style.transitionDuration,
        animationName: node.style.animationName
      };
      node.style.transitionDuration = "0s";
      node.style.animationName = "none";
      const rect = node.getBoundingClientRect();
      heightRef.current = rect.height;
      widthRef.current = rect.width;
      if (!isMountAnimationPreventedRef.current) {
        node.style.transitionDuration = originalStylesRef.current.transitionDuration;
        node.style.animationName = originalStylesRef.current.animationName;
      }
      setIsPresent(present);
    }
  }, [context.open, present]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Primitive.div,
    {
      "data-state": getState(context.open),
      "data-disabled": context.disabled ? "" : void 0,
      id: context.contentId,
      hidden: !isOpen,
      ...contentProps,
      ref: composedRefs,
      style: {
        [`--radix-collapsible-content-height`]: height ? `${height}px` : void 0,
        [`--radix-collapsible-content-width`]: width ? `${width}px` : void 0,
        ...props.style
      },
      children: isOpen && children
    }
  );
});
function getState(open) {
  return open ? "open" : "closed";
}
var Root = Collapsible$1;
const Collapsible = Root;
const CollapsibleTrigger = CollapsibleTrigger$1;
const CollapsibleContent = CollapsibleContent$1;
const UserGuide = () => {
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [openSections, setOpenSections] = reactExports.useState(["getting-started"]);
  const toggleSection = (sectionId) => {
    setOpenSections(
      (prev) => prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };
  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Welcome to Voice Keeper!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Voice Keeper is your intelligent data entry and management companion. You can add entries through traditional forms or use our powerful voice interface to capture information naturally." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium", children: "First Steps:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "list-decimal list-inside space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Complete your account setup and profile information" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Visit the Dashboard to see your data overview" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: 'Try creating your first entry using the "Add Entry" button' }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Test voice commands by clicking the microphone icon" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Explore categories to organize your data" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted p-4 rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Quick Navigation:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Dashboard:" }),
              " Overview of your data and recent activity"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "All Entries:" }),
              " Browse and manage all your data"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Categories:" }),
              " Organized views of your information"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Brain Dump:" }),
              " Quick voice capture for ideas and notes"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Settings:" }),
              " Customize your experience"
            ] })
          ] })
        ] })
      ] })
    },
    {
      id: "adding-entries",
      title: "Adding Entries",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Creating Data Entries" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Method 1: Manual Form Entry" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "list-decimal list-inside space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: 'Click "Add Entry" from the dashboard or navigation' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Fill in the required fields (title, content, etc.)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Select a category to organize your entry" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Add custom fields if needed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Upload images or files if relevant" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: 'Click "Save" to store your entry' })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Method 2: Voice Entry" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "list-decimal list-inside space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Click the microphone icon anywhere in the app" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: 'Say "Create a new entry" or similar command' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Speak naturally about what you want to record" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "The AI will structure your speech into proper fields" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Review and confirm the generated entry" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Voice Entry Tips:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Speak clearly and at a normal pace" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: '• Include context: "This is a meeting note about..."' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: '• Mention categories: "Add this to my work projects"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use natural language - the AI understands context" })
            ] })
          ] })
        ] })
      ] })
    },
    {
      id: "voice-commands",
      title: "Voice Commands",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Voice Interface Guide" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Our advanced voice interface understands natural language and can perform various actions through speech." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Basic Commands:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: '"Create a new entry"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: '"Show my documents"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: '"Search for meetings"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: '"Delete old entries"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: '"Export my data"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: '"Go to settings"' })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Advanced Usage:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Conversational:" }),
                ' "I need to record information about my client meeting today"'
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Specific:" }),
                ' "Create a shopping list with milk, bread, and eggs"'
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Context-aware:" }),
                ' "Add this receipt to my business expenses category"'
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Multi-step:" }),
                ' "Create a project entry and set a reminder for next week"'
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 dark:bg-green-950/20 p-4 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Voice Best Practices:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Ensure your microphone has permissions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Speak in a quiet environment for better accuracy" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Wait for the system to process before speaking again" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use the visual feedback to confirm commands" })
            ] })
          ] })
        ] })
      ] })
    },
    {
      id: "brain-dump",
      title: "Brain Dump Feature",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Brain Dump: Capture Ideas Instantly" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "The Brain Dump feature is perfect for quickly capturing thoughts, ideas, or information without worrying about structure." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "How to Use Brain Dump:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "list-decimal list-inside space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: 'Navigate to the Brain Dump page or use voice command "Start brain dump"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: 'Click "Start Recording" or use the voice activation' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Speak freely about your thoughts, ideas, or information" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "The system will automatically segment and organize your content" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Review the captured segments and save what you need" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Perfect for:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Brainstorming sessions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Meeting notes on-the-go" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Quick idea capture" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Stream-of-consciousness recording" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Voice journaling" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Pro Tip:" }),
            " Brain Dump automatically identifies different topics and can suggest categories for your content, making it easy to organize later."
          ] }) })
        ] })
      ] })
    },
    {
      id: "organization",
      title: "Organization & Categories",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Organizing Your Data" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Categories:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Categories help organize your entries into logical groups for easy retrieval." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Categories are automatically suggested based on content" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• You can create custom categories for your specific needs" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Entries can belong to multiple categories" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use the category view to see all entries in a specific group" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Search and Filtering:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use the search bar to find entries by keywords" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Filter by date, category, or entry type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Smart search understands context and related terms" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Recent searches are saved for quick access" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Custom Fields:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Add custom fields to entries for structured data capture like contact information, project details, or any specific data points you need to track." })
          ] })
        ] })
      ] })
    },
    {
      id: "documents",
      title: "Document Management",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Working with Documents" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Document Creation:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Create rich text documents with formatting" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Generate documents from your data entries" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use templates for consistent formatting" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Collaborate on documents with built-in editing tools" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "File Uploads:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Upload images, PDFs, and other documents" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Attach files to entries for reference" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Automatic text extraction from uploaded documents" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Image recognition for better organization" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Export Options:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Export individual entries or entire datasets" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Multiple format support: PDF, Word, CSV, JSON" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Batch export for multiple entries" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Scheduled exports for regular backups" })
            ] })
          ] })
        ] })
      ] })
    },
    {
      id: "search-filter",
      title: "Search & Filtering",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Finding Your Data" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Smart Search:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Search by keywords, phrases, or content" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: '• Natural language queries: "meetings from last week"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Search within specific categories or date ranges" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Auto-complete suggestions based on your data" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Advanced Filtering:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Filter by creation date, modification date" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Category-based filtering" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Content type filters (text, images, documents)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Custom field value filtering" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Saved Searches:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Save frequently used search queries" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Quick access to important data sets" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Share saved searches with team members" })
            ] })
          ] })
        ] })
      ] })
    },
    {
      id: "settings",
      title: "Settings & Customization",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Personalizing Your Experience" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Profile Settings:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Update your personal information and preferences" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Set your default categories and custom fields" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Configure display name and avatar" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Voice Settings:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Adjust microphone sensitivity" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Set preferred language and accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Configure voice command triggers" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Enable/disable text-to-speech feedback" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Appearance:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Choose between light and dark themes" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Adjust font size and display preferences" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Customize dashboard layout" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Data Management:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Export all your data for backup" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Import data from other applications" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Configure automatic backups" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Data retention policies" })
            ] })
          ] })
        ] })
      ] })
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Common Issues & Solutions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-muted rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Voice Commands Not Working" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Check microphone permissions in your browser" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Ensure you're using a supported browser (Chrome, Edge, Safari)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Try refreshing the page" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Check if other applications are using your microphone" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-muted rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Data Not Syncing" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Check your internet connection" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Ensure you're logged in to your account" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Try logging out and back in" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Clear browser cache if issues persist" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-muted rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Export Not Working" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Check if you have entries to export" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Try a different export format" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Ensure pop-ups are allowed for downloads" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Check available storage space" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-muted rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Performance Issues" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Close unnecessary browser tabs" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Clear browser cache and cookies" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Update your browser to the latest version" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Check if extensions are causing conflicts" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Still Need Help?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "If you're still experiencing issues, please contact our support team through the Settings → Help & Support section with detailed information about the problem." })
          ] })
        ] })
      ] })
    },
    {
      id: "tips",
      title: "Tips & Best Practices",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-5 h-5" }),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Pro Tips for Power Users" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Voice Efficiency" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use voice shortcuts for repetitive tasks" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Create voice templates for common entries" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Learn the conversational commands" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-green-50 dark:bg-green-950/20 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Organization" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use consistent naming for categories" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Tag entries with multiple categories" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Regular cleanup of old entries" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Data Entry" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Include relevant keywords for better search" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use custom fields for structured data" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Add images and files for context" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Workflow" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Set up regular export schedules" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use Brain Dump for quick capture" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Leverage search analytics for insights" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium mb-2", children: "Advanced Workflow" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "Combine voice commands, categories, and smart search to create an efficient data management workflow that adapts to your specific needs." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Pro Tip: Use voice commands to navigate between features while keeping your hands free for other tasks" })
          ] })
        ] })
      ] })
    }
  ];
  const filteredSections = sections.filter(
    (section) => searchTerm === "" || section.title.toLowerCase().includes(searchTerm.toLowerCase()) || section.content.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        "Back to Dashboard"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "User Guide" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Complete guide to using Voice Keeper" })
      ] })
    ] }) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "sticky top-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "Search guide...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "pl-9"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "space-y-2", children: filteredSections.map((section) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => toggleSection(section.id),
            className: `w-full flex items-center gap-2 p-2 text-left rounded-lg hover:bg-muted transition-colors ${openSections.includes(section.id) ? "bg-muted" : ""}`,
            children: [
              section.icon,
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: section.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChevronRight,
                {
                  className: `w-4 h-4 ml-auto transition-transform ${openSections.includes(section.id) ? "rotate-90" : ""}`
                }
              )
            ]
          },
          section.id
        )) }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: filteredSections.map((section) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Collapsible,
        {
          open: openSections.includes(section.id),
          onOpenChange: () => toggleSection(section.id),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "cursor-pointer hover:bg-muted/50 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-3", children: [
              section.icon,
              section.title,
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChevronRight,
                {
                  className: `w-5 h-5 ml-auto transition-transform ${openSections.includes(section.id) ? "rotate-90" : ""}`
                }
              )
            ] }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: section.content }) })
          ] })
        },
        section.id
      )) }) })
    ] }) })
  ] });
};
export {
  UserGuide as default
};
