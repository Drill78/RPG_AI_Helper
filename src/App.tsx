import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  Compass,
  FolderHeart,
  Home,
  Menu,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  WandSparkles,
  Wrench,
  X,
} from "lucide-react";
import { WorkspaceProvider, useWorkspace } from "./store";
import { lessons, prompts, toolItems } from "./content";
import { Empty, Modal, navigate } from "./components/ui";
import { GuildPage, GuildsPage, HomePage, LessonPage } from "./pages/Learning";
import {
  CollectionPage,
  PromptPage,
  PromptsPage,
  ToolsPage,
} from "./pages/Library";
import { TeamPage } from "./pages/Team";
import { SettingsPage } from "./pages/Settings";

const navigation = [
  { id: "home", label: "冒险起点", sub: "我的工作台", icon: Home },
  { id: "guilds", label: "学习公会", icon: Compass },
  { id: "prompts", label: "提示词工坊", icon: WandSparkles },
  { id: "tools", label: "工具装备库", icon: Wrench },
  { id: "team", label: "小队任务板", icon: Users },
  { id: "collection", label: "我的收藏", icon: FolderHeart },
];
function Shell() {
  const {
    state,
    memberId,
    setMemberId,
    loading,
    error,
    refresh,
    notice,
    busy,
  } = useWorkspace();
  const [route, setRoute] = useState(
      () => window.location.hash.slice(1) || "home",
    ),
    [searchOpen, setSearchOpen] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false),
    [memberMenu, setMemberMenu] = useState(false);
  useEffect(() => {
    function update() {
      setRoute(window.location.hash.slice(1) || "home");
      setMobileMenu(false);
      window.scrollTo({ top: 0 });
    }
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setMobileMenu(false);
        setMemberMenu(false);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const [section, id] = route.split("/"),
    active =
      section === "guild" || section === "lesson"
        ? "guilds"
        : section === "prompt"
          ? "prompts"
          : section;
  const label =
    navigation.find((n) => n.id === active)?.label || "工作区与指南";
  useEffect(() => {
    document.title = `${label} · 行会 AI`;
  }, [label]);
  if (loading)
    return (
      <div className="app-loading">
        <span className="brand-symbol">✦</span>
        <h2>行会正在准备你的工作台</h2>
        <p>载入学习路线与伙伴的进度…</p>
        <div className="loading-line" />
      </div>
    );
  if (!state)
    return (
      <div className="app-loading">
        <Empty
          title="还没有连接到本地工作区"
          text={error || "请通过项目的一键启动入口打开工作台。"}
          action={
            <button className="button primary" onClick={() => void refresh()}>
              重新连接
            </button>
          }
        />
      </div>
    );
  const member =
      state.members.find((m) => m.id === memberId) || state.members[0],
    outstanding = state.tasks.filter(
      (t) => t.assignee === memberId && t.status !== "done",
    ).length;
  let page: ReactNode;
  if (section === "home") page = <HomePage />;
  else if (section === "guilds") page = <GuildsPage />;
  else if (section === "guild") page = <GuildPage id={id} />;
  else if (section === "lesson")
    page = <LessonPage key={`${id}-${memberId}`} id={id} />;
  else if (section === "prompts") page = <PromptsPage guild={id} />;
  else if (section === "prompt")
    page = <PromptPage key={`${id}-${memberId}`} id={id} />;
  else if (section === "tools") page = <ToolsPage selectedId={id} />;
  else if (section === "team") page = <TeamPage />;
  else if (section === "collection") page = <CollectionPage key={memberId} />;
  else if (section === "settings") page = <SettingsPage />;
  else
    page = (
      <div className="page">
        <Empty
          title="这条小路还没有开放"
          text="回到工作台，继续探索已有的内容。"
          action={
            <button className="button primary" onClick={() => navigate("home")}>
              回到起点
            </button>
          }
        />
      </div>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        跳到主要内容
      </a>
      {mobileMenu ? (
        <button
          aria-label="关闭导航遮罩"
          className="nav-scrim"
          onClick={() => setMobileMenu(false)}
        />
      ) : null}
      <aside
        className={`sidebar ${mobileMenu ? "open" : ""}`}
        aria-label="工作区导航与成员"
      >
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="行会 AI 首页"
        >
          <span className="brand-symbol">✦</span>
          <span>
            <strong>
              行会<span> AI</span>
            </strong>
            <small>LEARN. MAKE. TOGETHER.</small>
          </span>
        </button>
        <div className="workspace-label">
          <span className="mini-square">
            <Shield size={13} />
          </span>
          我们的创造小队
          <BadgeLocal />
        </div>
        <span className="nav-heading">我的探索</span>
        <nav aria-label="主要导航">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => navigate(item.id)}
              aria-current={active === item.id ? "page" : undefined}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.id === "team" && outstanding > 0 ? (
                <span className="nav-count">{outstanding}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="camp-note">
            <span className="camp-spark">✧</span>
            <p>
              比昨天的自己，
              <br />
              <strong>多做成一点点。</strong>
            </p>
            <span className="pixel-tree" aria-hidden="true">
              ♜
            </span>
          </div>
          <button
            className={`nav-item ${section === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings size={18} />
            <span>工作区与指南</span>
          </button>
          <div className="member-switcher">
            {memberMenu ? (
              <div className="member-menu">
                <span className="small-label">切换成员 · 独立学习记录</span>
                {state.members.map((m) => (
                  <button
                    key={m.id}
                    disabled={busy}
                    onClick={() => {
                      setMemberId(m.id);
                      setMemberMenu(false);
                    }}
                  >
                    <span
                      className="avatar small"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.name.slice(0, 1)}
                    </span>
                    <span>{m.name}</span>
                    {memberId === m.id ? <Check size={15} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              className="member-current"
              aria-label="切换当前成员"
              aria-expanded={memberMenu}
              onClick={() => setMemberMenu((v) => !v)}
            >
              <span
                className="avatar"
                style={{ backgroundColor: member.color }}
              >
                {member.name.slice(0, 1)}
              </span>
              <span>
                <strong>{member.name}</strong>
                <small>{member.role}</small>
              </span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              aria-label="打开导航"
              onClick={() => setMobileMenu((v) => !v)}
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="breadcrumb">
              我的工作区<span>/</span>
              <strong>{label}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <button
              className="global-search-trigger"
              aria-label="打开全局搜索"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>搜索知识、提示词、工具</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className={`local-status ${error ? "disconnected" : ""}`}
              onClick={() => void refresh()}
              disabled={busy}
              aria-label="刷新工作区状态"
            >
              <i />
              {error ? "等待重新连接" : "本地已连接"}
            </button>
            <button
              className="icon-button help-button"
              aria-label="查看使用指南"
              onClick={() => navigate("settings")}
            >
              <CircleHelp size={20} />
            </button>
          </div>
        </header>
        {error ? (
          <div className="connection-banner" role="alert">
            <span>{error}</span>
            <button className="text-link" onClick={() => void refresh()}>
              重新连接
            </button>
          </div>
        ) : null}
        <main id="main" tabIndex={-1}>
          {page}
        </main>
        <footer className="app-footer">
          <span>行会 AI · 把好奇变成能力</span>
          <span>
            本地工作区 <i>·</i> 数据保存在你的电脑上
          </span>
        </footer>
      </div>
      {notice ? (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      ) : null}
      {busy ? (
        <div className="saving-indicator" aria-live="polite">
          正在保存…
        </div>
      ) : null}
      {searchOpen ? (
        <SearchDialog onClose={() => setSearchOpen(false)} />
      ) : null}
    </>
  );
}
function BadgeLocal() {
  return <span className="local-pill">LOCAL</span>;
}
function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = [
    ...lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.subtitle,
      type: "学习节点",
      icon: BookOpen,
      route: `lesson/${l.id}`,
    })),
    ...prompts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.summary,
      type: "提示词",
      icon: WandSparkles,
      route: `prompt/${p.id}`,
    })),
    ...toolItems.map((t) => ({
      id: t.id,
      title: t.name,
      description: t.description,
      type: "工具",
      icon: Wrench,
      route: "tools/" + t.id,
    })),
  ]
    .filter(
      (item) =>
        q && `${item.title}${item.description}`.toLowerCase().includes(q),
    )
    .slice(0, 12);
  return (
    <Modal title="找到你的下一步" onClose={onClose} wide>
      <label className="command-search">
        <Search size={20} />
        <input
          autoFocus
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="试试「企划」「核验」「工作流」…"
          aria-label="全局搜索"
        />
        <kbd>ESC</kbd>
      </label>
      <div className="search-results">
        {q ? (
          results.length ? (
            results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  navigate(result.route);
                  onClose();
                }}
              >
                <span className="search-result-icon">
                  <result.icon size={19} />
                </span>
                <div>
                  <span className="small-label">{result.type}</span>
                  <h3>{result.title}</h3>
                  <p>{result.description}</p>
                </div>
                <ArrowRight size={17} />
              </button>
            ))
          ) : (
            <Empty title="还没找到这条线索" text="换一个更短的关键词试试。" />
          )
        ) : (
          <div className="search-suggestions">
            <Sparkles size={26} />
            <p>在课程、配方和工具中搜索</p>
            <div>
              {["提问", "游戏", "工作流", "核验"].map((s) => (
                <button key={s} onClick={() => setQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
            <span>
              <Command size={13} /> Ctrl + K 随时唤出搜索
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Workspace error", error, info);
  }
  render() {
    return this.state.failed ? (
      <div className="app-loading">
        <Empty
          title="工作台遇到了一点问题"
          text="已保存的数据仍在本地。请重新载入页面后继续。"
          action={
            <button
              className="button primary"
              onClick={() => window.location.reload()}
            >
              重新载入
            </button>
          }
        />
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <Shell />
      </WorkspaceProvider>
    </ErrorBoundary>
  );
}
