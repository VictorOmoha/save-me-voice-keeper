import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { E as Extension, u as useEditor, i as index_default$1, a as EditorContent } from "./vendor-editor-DOFb55Eh.js";
import { c as createLucideIcon, B as Button, U as AlignLeft, k as List } from "./index-CT7EzYyk.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
const AlignCenter = createLucideIcon("AlignCenter", [
  ["path", { d: "M17 12H7", key: "16if0g" }],
  ["path", { d: "M19 18H5", key: "18s9l3" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
]);
const AlignRight = createLucideIcon("AlignRight", [
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M21 18H7", key: "1ygte8" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
]);
const Bold = createLucideIcon("Bold", [
  [
    "path",
    { d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8", key: "mg9rjx" }
  ]
]);
const Italic = createLucideIcon("Italic", [
  ["line", { x1: "19", x2: "10", y1: "4", y2: "4", key: "15jd3p" }],
  ["line", { x1: "14", x2: "5", y1: "20", y2: "20", key: "bu0au3" }],
  ["line", { x1: "15", x2: "9", y1: "4", y2: "20", key: "uljnxc" }]
]);
const ListOrdered = createLucideIcon("ListOrdered", [
  ["path", { d: "M10 12h11", key: "6m4ad9" }],
  ["path", { d: "M10 18h11", key: "11hvi2" }],
  ["path", { d: "M10 6h11", key: "c7qv1k" }],
  ["path", { d: "M4 10h2", key: "16xx2s" }],
  ["path", { d: "M4 6h1v4", key: "cnovpq" }],
  ["path", { d: "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1", key: "m9a95d" }]
]);
const Redo = createLucideIcon("Redo", [
  ["path", { d: "M21 7v6h-6", key: "3ptur4" }],
  ["path", { d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7", key: "1kgawr" }]
]);
const Underline = createLucideIcon("Underline", [
  ["path", { d: "M6 4v6a6 6 0 0 0 12 0V4", key: "9kb039" }],
  ["line", { x1: "4", x2: "20", y1: "20", y2: "20", key: "nun2al" }]
]);
const Undo = createLucideIcon("Undo", [
  ["path", { d: "M3 7v6h6", key: "1v2h90" }],
  ["path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13", key: "1r6uu6" }]
]);
var TextAlign = Extension.create({
  name: "textAlign",
  addOptions() {
    return {
      types: [],
      alignments: ["left", "center", "right", "justify"],
      defaultAlignment: null
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              const alignment = element.style.textAlign;
              return this.options.alignments.includes(alignment) ? alignment : this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign) {
                return {};
              }
              return { style: `text-align: ${attributes.textAlign}` };
            }
          }
        }
      }
    ];
  },
  addCommands() {
    return {
      setTextAlign: (alignment) => ({ commands }) => {
        if (!this.options.alignments.includes(alignment)) {
          return false;
        }
        return this.options.types.map((type) => commands.updateAttributes(type, { textAlign: alignment })).every((response) => response);
      },
      unsetTextAlign: () => ({ commands }) => {
        return this.options.types.map((type) => commands.resetAttributes(type, "textAlign")).every((response) => response);
      },
      toggleTextAlign: (alignment) => ({ editor, commands }) => {
        if (!this.options.alignments.includes(alignment)) {
          return false;
        }
        if (editor.isActive({ textAlign: alignment })) {
          return commands.unsetTextAlign();
        }
        return commands.setTextAlign(alignment);
      }
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-l": () => this.editor.commands.setTextAlign("left"),
      "Mod-Shift-e": () => this.editor.commands.setTextAlign("center"),
      "Mod-Shift-r": () => this.editor.commands.setTextAlign("right"),
      "Mod-Shift-j": () => this.editor.commands.setTextAlign("justify")
    };
  }
});
var index_default = TextAlign;
const RichTextEditor = ({
  content,
  onContentChange,
  placeholder = "Start writing your document..."
}) => {
  const editor = useEditor({
    extensions: [
      index_default$1,
      index_default.configure({
        types: ["heading", "paragraph"]
      })
    ],
    content,
    onUpdate: ({ editor: editor2 }) => {
      onContentChange(editor2.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4"
      }
    }
  });
  reactExports.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);
  if (!editor) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border rounded-lg bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleBold().run(),
          className: editor.isActive("bold") ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bold, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleItalic().run(),
          className: editor.isActive("italic") ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Italic, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleUnderline().run(),
          className: editor.isActive("underline") ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Underline, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-border mx-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().setTextAlign("left").run(),
          className: editor.isActive({ textAlign: "left" }) ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlignLeft, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().setTextAlign("center").run(),
          className: editor.isActive({ textAlign: "center" }) ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlignCenter, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().setTextAlign("right").run(),
          className: editor.isActive({ textAlign: "right" }) ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlignRight, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-border mx-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleBulletList().run(),
          className: editor.isActive("bulletList") ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().toggleOrderedList().run(),
          className: editor.isActive("orderedList") ? "bg-accent" : "",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ListOrdered, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-border mx-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().undo().run(),
          disabled: !editor.can().undo(),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Undo, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => editor.chain().focus().redo().run(),
          disabled: !editor.can().redo(),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Redo, { className: "w-4 h-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-[300px] bg-background text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditorContent, { editor }) })
  ] });
};
export {
  RichTextEditor
};
