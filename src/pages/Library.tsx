import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  FolderHeart,
  Info,
  Search,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  Wrench,
} from "lucide-react";
import { lessons, prompts, toolItems } from "../content";
import { useWorkspace } from "../store";
import type { PromptRecipe } from "../types";
import {
  Badge,
  copyText,
  Empty,
  Modal,
  navigate,
  PageIntro,
  SourceList,
} from "../components/ui";

function useBookmark() {
  const { progress, memberId, mutate, busy } = useWorkspace();
  return {
    bookmarks: progress.bookmarks,
    busy,
    toggle: (id: string) =>
      mutate(`progress/${memberId}`, "PATCH", {
        bookmarks: progress.bookmarks.includes(id)
          ? progress.bookmarks.filter((p) => p !== id)
          : [...progress.bookmarks, id],
      }),
  };
}
export function RecipeCard({ recipe }: { recipe: PromptRecipe }) {
  const { bookmarks, toggle, busy } = useBookmark();
  return (
    <article className={`recipe-card ${recipe.guild}`}>
      <div className="recipe-top">
        <span className="recipe-icon">
          <WandSparkles size={23} />
        </span>
        <button
          className={`icon-button bookmark-button ${bookmarks.includes(recipe.id) ? "active" : ""}`}
          disabled={busy}
          onClick={() => void toggle(recipe.id)}
          aria-label={`${bookmarks.includes(recipe.id) ? "取消收藏" : "收藏"}：${recipe.title}`}
        >
          <Bookmark
            size={18}
            fill={bookmarks.includes(recipe.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <button
        className="recipe-card-main"
        onClick={() => navigate(`prompt/${recipe.id}`)}
      >
        <span className="small-label">{recipe.category}</span>
        <h3>{recipe.title}</h3>
        <p>{recipe.summary}</p>
        <div className="tag-list">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="recipe-bottom">
          <span>
            <Clock3 size={13} />
            {recipe.minutes} 分钟 <i>·</i> {recipe.difficulty}
          </span>
          <ArrowRight size={17} />
        </div>
      </button>
    </article>
  );
}
export function PromptsPage({ guild = "" }: { guild?: string }) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(guild),
    [difficulty, setDifficulty] = useState("");
  useEffect(() => {
    setFilter(guild);
  }, [guild]);
  const list = prompts.filter(
    (p) =>
      (!filter || p.guild === filter) &&
      (!difficulty || p.difficulty === difficulty) &&
      `${p.title}${p.summary}${p.tags.join("")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <PageIntro
        eyebrow="A LITTLE MAGIC, A REAL RESULT"
        title="提示词工坊"
        description="把好方法做成随取随用的卷轴。每一份都有准备材料、操作步骤和验收标准。"
      />
      <div className="library-note">
        <Sparkles size={19} />
        <span>
          选择配方 → 填入需求 → 复制到你使用的 AI 工具 →
          检查结果。让提示词真正为你所用。
        </span>
      </div>
      <div className="filter-toolbar">
        <div className="segmented" aria-label="提示词方向">
          {[
            ["", "全部配方"],
            ["general", "通用 AI"],
            ["game", "游戏制作"],
          ].map(([value, label]) => (
            <button
              className={filter === value ? "active" : ""}
              key={value}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filter-right">
          <label className="search-input">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索任务、技巧或关键词"
              aria-label="搜索提示词"
            />
          </label>
          <label className="filter-select">
            <SlidersHorizontal size={15} />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              aria-label="提示词难度"
            >
              <option value="">所有难度</option>
              <option>入门</option>
              <option>进阶</option>
            </select>
          </label>
        </div>
      </div>
      <div className="result-count">
        共 {list.length} 份实践配方<span>提示词需要结合你的实际材料使用</span>
      </div>
      <h2 className="sr-only">实践配方列表</h2>
      {list.length ? (
        <div className="recipe-grid">
          {list.map((p) => (
            <RecipeCard recipe={p} key={p.id} />
          ))}
        </div>
      ) : (
        <Empty
          title="暂时没有匹配的配方"
          text="试试更短的关键词，或切换到全部配方。"
          action={
            <button
              className="button secondary"
              onClick={() => {
                setQuery("");
                setFilter("");
                setDifficulty("");
              }}
            >
              清除筛选
            </button>
          }
        />
      )}
    </div>
  );
}
export function PromptPage({ id }: { id: string }) {
  const recipe = prompts.find((p) => p.id === id),
    { state, memberId, mutate, busy, toast } = useWorkspace();
  const { bookmarks, toggle } = useBookmark();
  const [values, setValues] = useState<Record<string, string>>({}),
    [custom, setCustom] = useState<string | null>(null),
    [copied, setCopied] = useState(false),
    [tab, setTab] = useState("compose");
  useEffect(() => {
    setValues(
      Object.fromEntries(
        (recipe?.variables || []).map((v) => [v.key, v.defaultValue || ""]),
      ),
    );
    setCustom(null);
    setTab("compose");
    setCopied(false);
  }, [id, recipe]);
  const generated = useMemo(
    () =>
      recipe?.template.replace(
        /\{\{\s*([^{}]+?)\s*\}\}/g,
        (_, key: string) =>
          values[key] ||
          `【请填写：${recipe.variables.find((v) => v.key === key)?.label || key}】`,
      ) || "",
    [recipe, values],
  );
  const text = custom ?? generated;
  if (!recipe || !state)
    return (
      <Empty
        title="没有找到这份配方"
        text="到提示词工坊选择一份适合你的方法。"
        action={
          <button
            className="button primary"
            onClick={() => navigate("prompts")}
          >
            返回工坊
          </button>
        }
      />
    );
  const save = async () => {
    if (text.length > 40000) {
      toast("提示词超过 40,000 字，请精简后再保存。");
      return;
    }
    if (
      await mutate("saved-prompts", "POST", {
        memberId,
        title: recipe.title,
        text,
        sourceId: id,
      })
    )
      toast("已保存到「我的收藏 · 提示词笔记」");
  };
  const copy = async () => {
    try {
      await copyText(text);
      setCopied(true);
      toast("提示词已复制，可以粘贴到你的 AI 工具");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const missing = recipe.variables.filter((v) => !values[v.key]?.trim()).length;
  return (
    <div className="page prompt-page">
      <button
        className="back-link"
        onClick={() => navigate(`prompts/${recipe.guild}`)}
      >
        <ArrowLeft size={15} />
        返回提示词工坊
      </button>
      <div className="prompt-title">
        <div>
          <div className="tag-list">
            <Badge tone={recipe.guild === "general" ? "sage" : "orange"}>
              {recipe.guild === "general" ? "通用 AI 实践" : "游戏制作人"}
            </Badge>
            <Badge>{recipe.difficulty}</Badge>
          </div>
          <h1>{recipe.title}</h1>
          <p>{recipe.summary}</p>
        </div>
        <button
          className={`button secondary ${bookmarks.includes(id) ? "saved" : ""}`}
          disabled={busy}
          onClick={() => void toggle(id)}
        >
          <Bookmark
            size={16}
            fill={bookmarks.includes(id) ? "currentColor" : "none"}
          />
          {bookmarks.includes(id) ? "已收藏配方" : "收藏配方"}
        </button>
      </div>
      <div className="page-tabs">
        <button
          className={tab === "compose" ? "active" : ""}
          onClick={() => setTab("compose")}
        >
          <WandSparkles size={16} />
          制作你的提示词
        </button>
        <button
          className={tab === "guide" ? "active" : ""}
          onClick={() => setTab("guide")}
        >
          <BookGuide />
          使用指南与检查
        </button>
      </div>
      {tab === "compose" ? (
        <div className="prompt-workbench">
          <aside className="prompt-inputs" aria-label="填写提示词需求">
            <div className="section-title">
              <h2>填写你的需求</h2>
              <Badge>01</Badge>
            </div>
            <p className="muted">具体的上下文，往往比更长的提示词更重要。</p>
            {recipe.variables.map((variable) => (
              <label className="field" key={variable.key}>
                <span>{variable.label}</span>
                <textarea
                  value={values[variable.key] || ""}
                  onChange={(e) => {
                    setValues({ ...values, [variable.key]: e.target.value });
                    setCustom(null);
                    setCopied(false);
                  }}
                  placeholder={variable.placeholder}
                  rows={3}
                  maxLength={8000}
                />
              </label>
            ))}
            <div className="input-hint">
              <Info size={16} />
              <span>
                右侧内容会随填写更新，也可以直接编辑。更改左侧需求会重新生成文本。
              </span>
            </div>
            <h3>准备好这些材料</h3>
            <ul className="compact-list">
              {recipe.materials.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </aside>
          <section className="prompt-output">
            <div className="output-header">
              <div>
                <span className="terminal-dot" />
                <span className="terminal-dot" />
                <span className="terminal-dot" />
                <strong>你的专属提示词</strong>
              </div>
              <span>{text.length.toLocaleString()} 字符</span>
            </div>
            <label className="sr-only" htmlFor="prompt-result">
              生成的提示词
            </label>
            <textarea
              id="prompt-result"
              spellCheck={false}
              value={text}
              onChange={(e) => {
                setCustom(e.target.value);
                setCopied(false);
              }}
              maxLength={40000}
            />
            <div className="output-meta">
              <span>
                {custom !== null
                  ? "已手动编辑"
                  : missing
                    ? `还有 ${missing} 项需求可以补充`
                    : "需求已填写，可以开始使用"}
              </span>
              <button
                onClick={() => {
                  setCustom(null);
                  setCopied(false);
                }}
              >
                恢复模板
              </button>
            </div>
            <div className="output-actions">
              <button
                className="button secondary"
                disabled={busy || !text.trim()}
                onClick={() => void save()}
              >
                <FileText size={16} />
                保存为我的笔记
              </button>
              <button
                className="button primary"
                disabled={!text.trim()}
                onClick={() => void copy()}
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
                {copied ? "已复制" : "复制提示词"}
              </button>
            </div>
            <p className="prompt-disclaimer">
              <Info size={14} />
              这里帮你准备提示词；请在自己的 AI 工具中执行，并核验结果。
            </p>
          </section>
        </div>
      ) : (
        <div className="recipe-guide">
          <article>
            <h2>按这几步使用</h2>
            <ol className="method-steps">
              {recipe.steps.map((step, i) => (
                <li key={step}>
                  <span>{i + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <div className="exercise-box">
              <h2>怎样判断结果可用</h2>
              <ul>
                {recipe.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <h2>常见的坑</h2>
            <ul>
              {recipe.pitfalls.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <SourceList sources={recipe.sources} />
          </article>
          <aside className="guide-aside" aria-label="准备工具与材料">
            <h3>工具与材料</h3>
            <span className="small-label">适用工具</span>
            <div className="tag-list">
              {recipe.tools.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <span className="small-label">开始前准备</span>
            <ul>
              {recipe.materials.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <button
              className="button primary full"
              onClick={() => setTab("compose")}
            >
              开始填写需求
              <ArrowRight size={16} />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
function BookGuide() {
  return <FileText size={16} />;
}
export function ToolsPage({ selectedId }: { selectedId?: string }) {
  const [filter, setFilter] = useState(""),
    [query, setQuery] = useState("");
  useEffect(() => {
    if (selectedId) {
      setFilter("");
      setQuery("");
      const frame = requestAnimationFrame(() =>
        document
          .getElementById(`tool-${selectedId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [selectedId]);
  const list = toolItems.filter(
    (t) =>
      (!filter || t.guilds.includes(filter as "general" | "game")) &&
      `${t.name}${t.description}${t.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <PageIntro
        eyebrow="PACK LIGHT. CREATE MORE."
        title="工具装备库"
        description="工具是帮你完成任务的装备。知道用来做什么，比装得多更重要。"
      />
      <div className="filter-toolbar">
        <div className="segmented">
          {[
            ["", "全部装备"],
            ["general", "通用 AI"],
            ["game", "游戏制作"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具或用途"
            aria-label="搜索工具"
          />
        </label>
      </div>
      <h2 className="sr-only">工具列表</h2>
      <div className="tools-grid">
        {list.map((t, i) => (
          <article
            id={`tool-${t.id}`}
            className={`tool-card ${selectedId === t.id ? "highlighted" : ""}`}
            key={t.id}
          >
            <div className="tool-title">
              <span className={`tool-monogram color-${i % 4}`}>
                {t.name.slice(0, 1)}
              </span>
              <div>
                <h3>{t.name}</h3>
                <span>{t.category}</span>
              </div>
              <Wrench size={17} />
            </div>
            <p>{t.description}</p>
            <div className="tool-cost">{t.cost}</div>
            <div className="tool-note">{t.note}</div>
            <a href={t.url} target="_blank" rel="noopener noreferrer">
              前往官方页面
              <ExternalLink size={14} />
            </a>
          </article>
        ))}
      </div>
      {!list.length ? (
        <Empty
          title="没有找到这个工具"
          text="试试按用途搜索，或查看全部装备。"
        />
      ) : null}
      <p className="page-footnote">
        工具与学习内容独立更新。价格、平台支持与使用限制请以官方页面为准。
      </p>
    </div>
  );
}
export function CollectionPage() {
  const { state, memberId, progress, mutate, busy, toast } = useWorkspace();
  const [tab, setTab] = useState("bookmarks"),
    [openId, setOpenId] = useState<string | null>(null),
    [deleting, setDeleting] = useState(false);
  if (!state) return null;
  const saved = state.savedPrompts.filter((p) => p.memberId === memberId),
    favorites = prompts.filter((p) => progress.bookmarks.includes(p.id)),
    open = saved.find((p) => p.id === openId),
    notes = lessons.filter((l) => progress.notes[l.id]?.trim());
  return (
    <div className="page">
      <PageIntro
        eyebrow="YOUR PERSONAL FIELD NOTES"
        title="我的收藏"
        description="收好趁手的方法，也留下属于你自己的经验。每个成员都有独立的收藏与笔记。"
      />
      <div className="page-tabs">
        {[
          ["bookmarks", `配方收藏 ${favorites.length}`],
          ["saved", `提示词笔记 ${saved.length}`],
          ["notes", `实践笔记 ${notes.length}`],
        ].map(([key, label]) => (
          <button
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "bookmarks" ? (
        favorites.length ? (
          <div className="recipe-grid">
            {favorites.map((p) => (
              <RecipeCard key={p.id} recipe={p} />
            ))}
          </div>
        ) : (
          <Empty
            title="把第一份好方法收入背包"
            text="在提示词卡片上点击收藏，方便下次快速找到。"
            action={
              <button
                className="button primary"
                onClick={() => navigate("prompts")}
              >
                <FolderHeart size={17} />
                探索提示词
              </button>
            }
          />
        )
      ) : tab === "saved" ? (
        saved.length ? (
          <div className="saved-grid">
            {saved.map((p) => (
              <button
                key={p.id}
                className="saved-note"
                onClick={() => {
                  setOpenId(p.id);
                  setDeleting(false);
                }}
              >
                <FileText size={22} />
                <h3>{p.title}</h3>
                <p>{p.text.slice(0, 135)}…</p>
                <span>
                  {new Date(p.createdAt).toLocaleDateString("zh-CN")}
                  <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="留住你调整好的提示词"
            text="在配方中填写需求并编辑后，点击「保存为我的笔记」。"
            action={
              <button
                className="button primary"
                onClick={() => navigate("prompts")}
              >
                去工坊试一试
              </button>
            }
          />
        )
      ) : notes.length ? (
        <div className="saved-grid">
          {notes.map((l) => (
            <button
              className="saved-note"
              key={l.id}
              onClick={() => navigate(`lesson/${l.id}`)}
            >
              <FileText size={22} />
              <h3>{l.title}</h3>
              <p>{progress.notes[l.id]}</p>
              <span>
                回到实践节点
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          title="经验，会成为下次的捷径"
          text="在教程底部记录成果、疑问和收获，保存后就会出现在这里。"
          action={
            <button
              className="button primary"
              onClick={() => navigate("guilds")}
            >
              开始学习
            </button>
          }
        />
      )}
      {open ? (
        <Modal title={open.title} onClose={() => setOpenId(null)} wide>
          <textarea
            className="saved-text"
            readOnly
            value={open.text}
            aria-label="已保存的提示词"
          />
          <div className="modal-actions">
            <button
              className="button danger-ghost"
              disabled={busy}
              onClick={async () => {
                if (!deleting) {
                  setDeleting(true);
                  return;
                }
                if (await mutate(`saved-prompts/${open.id}`, "DELETE")) {
                  setOpenId(null);
                  toast("这份笔记已删除");
                }
              }}
            >
              {deleting ? "确认删除这份笔记" : "删除笔记"}
            </button>
            <button
              className="button primary"
              onClick={async () => {
                try {
                  await copyText(open.text);
                  toast("笔记已复制");
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              <Copy size={16} />
              复制内容
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
