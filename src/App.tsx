import { useState, useRef, useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Code,
  List,
  ListOrdered,
  Quote,
  Link,
  Upload,
  Download,
  Eye,
  Edit3,
  SplitSquareHorizontal,
  Trash2,
  FileText,
  Palette,
  Highlighter,
} from "lucide-react";

type ViewMode = "split" | "edit" | "preview";
type ToolAction =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "h1"
  | "h2"
  | "code"
  | "ul"
  | "ol"
  | "quote"
  | "link";

type ToolConfig = {
  icon: React.ReactNode;
  label: string;
  action: ToolAction;
};

const DEFAULT_MARKDOWN = `# Markdown Live

一个干净的实时 Markdown 编辑器，适合写作、整理笔记和导出 HTML。

---

## 格式示例

**加粗** · *斜体* · ~~删除线~~ · <u>下划线</u>

你也可以直接插入 HTML 标注，例如：

<span style="color:#111827">黑色文字</span> · <span style="color:#b42318">红色标注</span> · <mark style="background:#fff3bf">浅色高亮</mark>

### 任务框

- [x] 支持表格
- [ ] 支持任务项
- [ ] 支持 HTML 颜色标注

### 列表

- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2

### 代码

Inline \`code\` looks like this.

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

### 引用

> The best way to predict the future is to create it.

### 表格

| Feature | Status |
|---------|--------|
| Markdown | Ready |
| Preview | Ready |
| Export | Ready |

---

开始编辑，或者上传一个 \`.md\` 文件。
`;

const TEXT_COLORS = [
  { label: "Black", value: "#111827" },
  { label: "Gray", value: "#4b5563" },
  { label: "Red", value: "#b42318" },
  { label: "Blue", value: "#175cd3" },
];

const MARK_COLORS = [
  { label: "Warm", value: "#fff3bf" },
  { label: "Green", value: "#dcfae6" },
  { label: "Blue", value: "#d1e9ff" },
  { label: "Rose", value: "#ffe4e8" },
];

const TOOLS: ToolConfig[] = [
  {
    icon: <Bold size={16} />,
    label: "Bold",
    action: "bold",
  },
  {
    icon: <Italic size={16} />,
    label: "Italic",
    action: "italic",
  },
  {
    icon: <Underline size={16} />,
    label: "Underline",
    action: "underline",
  },
  {
    icon: <Strikethrough size={16} />,
    label: "Strikethrough",
    action: "strike",
  },
  {
    icon: <Heading1 size={16} />,
    label: "Heading 1",
    action: "h1",
  },
  {
    icon: <Heading2 size={16} />,
    label: "Heading 2",
    action: "h2",
  },
  {
    icon: <Code size={16} />,
    label: "Code",
    action: "code",
  },
  {
    icon: <List size={16} />,
    label: "Unordered List",
    action: "ul",
  },
  {
    icon: <ListOrdered size={16} />,
    label: "Ordered List",
    action: "ol",
  },
  {
    icon: <Quote size={16} />,
    label: "Blockquote",
    action: "quote",
  },
  {
    icon: <Link size={16} />,
    label: "Link",
    action: "link",
  },
];

function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const html = useMemo(() => {
    try {
      const result = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeHighlight, { detect: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(markdown);
      return String(result);
    } catch {
      return '<p class="parse-error">Failed to parse markdown</p>';
    }
  }, [markdown]);

  // ── Toolbar: wrap selection ──
  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = markdown.substring(start, end);
    const next =
      markdown.slice(0, start) +
      before +
      selected +
      after +
      markdown.slice(end);
    setMarkdown(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };

  const wrapSelectionWithFallback = (
    before: string,
    after: string,
    fallback: string,
  ) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = markdown.substring(start, end) || fallback;
    const next =
      markdown.slice(0, start) +
      before +
      selected +
      after +
      markdown.slice(end);
    setMarkdown(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };

  // ── Toolbar: line prefix ──
  const insertLinePrefix = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
    const next =
      markdown.slice(0, lineStart) + prefix + markdown.slice(lineStart);
    setMarkdown(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  // ── Toolbar: insert link ──
  const insertLink = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const link = "[text](url)";
    const next = markdown.slice(0, start) + link + markdown.slice(end);
    setMarkdown(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + 1, start + 1 + 4);
    });
  };

  const runToolAction = (action: ToolAction) => {
    switch (action) {
      case "bold":
        wrapSelection("**", "**");
        break;
      case "italic":
        wrapSelection("*", "*");
        break;
      case "underline":
        wrapSelection("<u>", "</u>");
        break;
      case "strike":
        wrapSelection("~~", "~~");
        break;
      case "h1":
        insertLinePrefix("# ");
        break;
      case "h2":
        insertLinePrefix("## ");
        break;
      case "code":
        wrapSelection("`", "`");
        break;
      case "ul":
        insertLinePrefix("- ");
        break;
      case "ol":
        insertLinePrefix("1. ");
        break;
      case "quote":
        insertLinePrefix("> ");
        break;
      case "link":
        insertLink();
        break;
    }
  };

  // ── File Upload ──
  const handleFile = (file: File) => {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      alert("Please upload a .md or .markdown file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setMarkdown(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // ── Download HTML ──
  const downloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName?.replace(/\.md$/, "") || "Markdown Export"}</title>
  <style>
    body {
      max-width: 800px; margin: 0 auto; padding: 2rem;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.75; color: #111827; background: #f3f0ea;
    }
    body::before {
      content: ""; position: fixed; inset: 0; pointer-events: none;
      background: linear-gradient(180deg, rgba(255,255,255,.74), rgba(255,255,255,.28));
    }
    body > * { position: relative; }
    img { max-width: 100%; border-radius: 8px; }
    pre { background: rgba(255,255,255,.72); border: 1px solid #e5e0d8; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { background: rgba(255,255,255,.72); border: 1px solid #ebe7df; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.875em; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ded9d0; padding: 0.5em 0.75em; text-align: left; }
    th { background: rgba(255,255,255,.72); }
    blockquote { border-left: 3px solid #111827; padding-left: 1em; color: #4b5563; }
    ul.contains-task-list { list-style: none; padding-left: 0; }
    li.task-list-item { display: flex; gap: .5em; align-items: flex-start; }
    input[type="checkbox"] { margin-top: .45em; accent-color: #111827; }
    mark { border-radius: 4px; padding: 0 .18em; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName?.replace(/\.md$/, "") || "export") + ".html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen bg-[#f3f0ea] text-[#111827] relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,255,255,0.22)),radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.9),transparent_34%)]" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.22] [background-image:linear-gradient(rgba(17,24,39,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="fixed left-0 top-0 h-full w-1.5 bg-[#111827] pointer-events-none" />

      {/* ── Drag Overlay ── */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f3f0ea]/80 backdrop-blur-md">
          <div className="rounded-2xl border-2 border-dashed border-[#111827]/30 bg-white/70 p-14 text-center shadow-[0_24px_80px_rgba(17,24,39,0.12)]">
            <Upload size={44} className="mx-auto mb-4 text-[#111827]" />
            <p className="text-lg font-medium text-[#111827]">
              Drop your .md file here
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-[#111827]/10 bg-white/45 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 min-h-16 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#111827] flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-semibold text-[#111827] tracking-tight">
              Markdown Live
            </h1>
            {fileName && (
              <span className="text-sm text-[#4b5563] ml-1 hidden sm:inline">
                / {fileName}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/60 rounded-xl p-0.5 border border-[#111827]/10 shadow-sm">
              {[
                {
                  mode: "edit" as ViewMode,
                  icon: <Edit3 size={15} />,
                  label: "Edit",
                },
                {
                  mode: "split" as ViewMode,
                  icon: <SplitSquareHorizontal size={15} />,
                  label: "Split",
                },
                {
                  mode: "preview" as ViewMode,
                  icon: <Eye size={15} />,
                  label: "Preview",
                },
              ].map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === mode
                      ? "bg-[#111827] text-white shadow-sm"
                      : "text-[#4b5563] hover:text-[#111827] hover:bg-white"
                  }`}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-[#111827]/10 hidden sm:block" />

            {/* Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/60 hover:bg-white text-[#111827] transition-all border border-[#111827]/10 shadow-sm"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />

            {/* Download */}
            <button
              onClick={downloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#111827] hover:bg-black text-white transition-all shadow-sm"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Clear */}
            <button
              onClick={() => {
                setMarkdown("");
                setFileName(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/40 hover:bg-white text-[#4b5563] hover:text-[#111827] transition-all border border-[#111827]/10"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main
        className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6"
        style={{ height: "calc(100vh - 4.25rem)" }}
      >
        <div className="flex h-full flex-col gap-4 md:gap-6 lg:flex-row">
          {/* ── Editor Panel ── */}
          {(viewMode === "edit" || viewMode === "split") && (
            <div
              className={`flex flex-col rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden ${
                viewMode === "split" ? "flex-1" : "flex-1"
              } bg-white/55 border-[#111827]/10 shadow-[0_24px_80px_rgba(17,24,39,0.08)]`}
            >
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#111827]/10 bg-white/45 overflow-x-auto shrink-0">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.action}
                    onClick={() => runToolAction(tool.action)}
                    title={tool.label}
                    className="p-2 rounded-lg text-[#4b5563] hover:text-[#111827] hover:bg-white transition-all shrink-0"
                  >
                    {tool.icon}
                  </button>
                ))}
                <div className="mx-1 h-6 w-px shrink-0 bg-[#111827]/10" />
                <div className="flex items-center gap-1 px-1" title="Text color">
                  <Palette size={16} className="text-[#4b5563]" />
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        wrapSelectionWithFallback(
                          `<span style="color:${color.value}">`,
                          "</span>",
                          "text",
                        )
                      }
                      title={`Text ${color.label}`}
                      className="h-5 w-5 shrink-0 rounded-full border border-[#111827]/15 shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <div className="mx-1 h-6 w-px shrink-0 bg-[#111827]/10" />
                <div className="flex items-center gap-1 px-1" title="Highlight color">
                  <Highlighter size={16} className="text-[#4b5563]" />
                  {MARK_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        wrapSelectionWithFallback(
                          `<mark style="background:${color.value}">`,
                          "</mark>",
                          "highlight",
                        )
                      }
                      title={`Highlight ${color.label}`}
                      className="h-5 w-5 shrink-0 rounded-full border border-[#111827]/15 shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 w-full bg-transparent text-[#111827] font-mono text-sm leading-relaxed p-5 resize-none outline-none placeholder:text-[#9ca3af]"
                placeholder="Type your Markdown here..."
                spellCheck={false}
              />
            </div>
          )}

          {/* ── Preview Panel ── */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div
              className={`flex flex-col rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden ${
                viewMode === "split" ? "flex-1" : "flex-1"
              } bg-white/55 border-[#111827]/10 shadow-[0_24px_80px_rgba(17,24,39,0.08)]`}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#111827]/10 bg-white/45 shrink-0">
                <span className="text-xs font-semibold text-[#111827] tracking-wider uppercase">
                  Preview
                </span>
                <span className="text-[10px] text-[#6b7280] font-mono">
                  {markdown.length} chars
                </span>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8">
                {html ? (
                  <div
                    className="markdown-preview max-w-none"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#9ca3af]">
                    <p>No content to preview</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
