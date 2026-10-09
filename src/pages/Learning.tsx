import { useNoteDraft } from "../useNoteDraft";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  Clock3,
  Compass,
  Flag,
  Gamepad2,
  Layers3,
  Lightbulb,
  NotebookPen,
  Sparkles,
  Sprout,
  Target,
  WandSparkles,
} from "lucide-react";
import { futureGuilds, guilds, lessons, prompts } from "../content";
import { useWorkspace } from "../store";
import type { GuildId } from "../types";
import {
  Badge,
  CheckRow,
  Empty,
  navigate,
  PageIntro,
  ProgressBar,
  SectionTitle,
  SourceList,
  TextLink,
} from "../components/ui";

export function GuildCard({ id }: { id: GuildId }) {
  const { progress } = useWorkspace(),
    guild = guilds.find((g) => g.id === id)!,
    list = lessons.filter((l) => l.guild === id),
    done = list.filter((l) => progress.completed.includes(l.id)).length;
  return (
    <button
      className={`guild-card ${guild.color}`}
      onClick={() => navigate(`guild/${id}`)}
    >
      <div className="guild-art">
        <img
          src={guild.image}
          alt={id === "general" ? "像素风知识图书馆" : "像素风游戏创造工坊"}
        />
        <span className="guild-art-label">
          {id === "general" ? "学会与 AI 一起工作" : "把想法变成可玩的世界"}
        </span>
        <span className="guild-emblem">
          {id === "general" ? <Sprout size={23} /> : <Gamepad2 size={23} />}
        </span>
      </div>
      <div className="guild-card-content">
        <div className="card-title-row">
          <h3>{guild.name}</h3>
          <ArrowUpRightIcon />
        </div>
        <p>{guild.description.split("\n")[0]}</p>
        <div className="tag-list">
          {guild.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="guild-progress">
          <span>{list.length} 个实践节点</span>
          <span>
            {done}/{list.length} 已完成
          </span>
        </div>
        <ProgressBar value={(done / list.length) * 100} tone={guild.color} />
      </div>
    </button>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={19} className="card-arrow" />;
}
export function HomePage() {
  const { state, memberId, progress } = useWorkspace();
  if (!state) return null;
  const member = state.members.find((m) => m.id === memberId)!,
    myTasks = state.tasks.filter(
      (t) => t.assignee === memberId && t.status !== "done",
    );
  const started = lessons.find(
    (l) =>
      (progress.checks[l.id]?.length || 0) > 0 &&
      !progress.completed.includes(l.id),
  );
  const next =
    started ||
    lessons.find((l) => !progress.completed.includes(l.id)) ||
    lessons[0];
  const finished = lessons.filter((l) =>
    progress.completed.includes(l.id),
  ).length;
  return (
    <div className="page home-page">
      <div className="greeting">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h1>
          你好，{member.name}
          <span className="greeting-spark">✦</span>
        </h1>
        <p>每一个真实的小成果，都值得一场新的冒险。</p>
      </div>
      <section className="hero">
        <img
          className="hero-art"
          src="/images/hero-dark.png"
          alt="古老石砌公会档案馆，两位冒险者在烛光下研究地图"
        />
        <div className="hero-copy">
          <Badge tone="sage">
            <span className="status-dot" /> 让学习，真的派上用场
          </Badge>
          <h2>
            带上好奇心，
            <br />把 <span>AI</span> 变成你的能力。
          </h2>
          <p>
            找到方向，学会方法，完成作品。
            <br />
            与你的伙伴一起，走好每一步。
          </p>
          <button
            className="button primary"
            onClick={() => navigate(`lesson/${next.id}`)}
          >
            {started ? "继续我的学习" : "开启今天的实践"}
            <ArrowRight size={17} />
          </button>
          <div className="hero-caption">
            <span>✦</span> 不只收藏知识，也创造真实成果
          </div>
        </div>
        <span className="hero-coordinate">GUILD JOURNAL · 001</span>
      </section>
      <div className="stat-strip">
        <div>
          <span className="stat-icon green">
            <CheckCheck size={20} />
          </span>
          <div>
            <strong>
              {finished}
              <small> / {lessons.length}</small>
            </strong>
            <span>完成实践节点</span>
          </div>
        </div>
        <div>
          <span className="stat-icon orange">
            <NotebookPen size={20} />
          </span>
          <div>
            <strong>
              {state.savedPrompts.filter((p) => p.memberId === memberId).length}
            </strong>
            <span>我的提示词笔记</span>
          </div>
        </div>
        <div>
          <span className="stat-icon lavender">
            <Flag size={20} />
          </span>
          <div>
            <strong>{myTasks.length}</strong>
            <span>待推进的任务</span>
          </div>
        </div>
        <div>
          <span className="stat-icon blue">
            <Compass size={20} />
          </span>
          <div>
            <strong>
              2<small> 个方向</small>
            </strong>
            <span>从通用到专业</span>
          </div>
        </div>
      </div>
      <div className="home-columns">
        <div>
          <SectionTitle
            title="选择你的学习公会"
            subtitle="用一个方向，连接知识、工具与实践。"
            action={
              <TextLink onClick={() => navigate("guilds")}>探索公会</TextLink>
            }
          />
          <div className="guild-grid">
            {guilds.map((g) => (
              <GuildCard key={g.id} id={g.id} />
            ))}
          </div>
        </div>
        <aside className="next-card" aria-label="下一步实践推荐">
          <span className="eyebrow">
            <span className="status-dot" /> 你的下一步
          </span>
          <div className="pixel-book" aria-hidden="true">
            <BookOpen size={35} />
            <span>✧</span>
          </div>
          <Badge tone="sage">
            {next.guild === "general" ? "通用 AI 实践" : "游戏制作人"} · LV.
            {next.level}
          </Badge>
          <h3>{next.title}</h3>
          <p>{next.outcome}</p>
          <div className="lesson-meta">
            <Clock3 size={14} />
            {next.minutes} 分钟<span>·</span>一个可验证的成果
          </div>
          <button
            className="button secondary full"
            onClick={() => navigate(`lesson/${next.id}`)}
          >
            进入实践
            <ArrowRight size={16} />
          </button>
          <div className="next-tip">
            <Lightbulb size={15} />
            <span>进度按真实成果记录，无需打卡刷经验。</span>
          </div>
        </aside>
      </div>
      <SectionTitle
        title="把好方法，随手带走"
        subtitle="准备好材料，填入你的需求，就能开始。"
        action={
          <TextLink onClick={() => navigate("prompts")}>
            打开提示词工坊
          </TextLink>
        }
      />
      <div className="featured-recipes">
        {[
          prompts.find((p) => p.guild === "general"),
          prompts.find((p) => p.guild === "game"),
          prompts.filter((p) => p.guild === "general")[3],
        ]
          .filter(Boolean)
          .map((p, i) => (
            <button
              key={p!.id}
              className="mini-recipe"
              onClick={() => navigate(`prompt/${p!.id}`)}
            >
              <div className={`recipe-glyph glyph-${i}`}>
                <WandSparkles size={22} />
              </div>
              <div>
                <span className="small-label">{p!.category}</span>
                <h3>{p!.title}</h3>
                <p>{p!.summary}</p>
              </div>
              <ArrowRight size={17} />
            </button>
          ))}
      </div>
      <div className="home-footer">
        <span>小队同行，想法成真。</span>
        <button onClick={() => navigate("team")}>
          看看伙伴们的任务
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
export function GuildsPage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="FIND YOUR PATH"
        title="学习公会"
        description="公会是你的学习方向。先练好通用方法，再去创造你在意的作品。"
      />
      <h2 className="sr-only">当前开放的学习公会</h2>
      <div className="guild-grid large">
        {guilds.map((g) => (
          <GuildCard key={g.id} id={g.id} />
        ))}
      </div>
      <div className="boundary-card">
        <div className="stat-icon green">
          <Layers3 size={24} />
        </div>
        <div>
          <h3>通用，意味着跨领域，而不是只教入门。</h3>
          <p>
            提问、信息核验、任务拆解、表格与工作流，属于可以带到任何职业的方法。需要引擎、美术管线或行业验收标准时，再进入相应专业公会。两条路径可以同时学习。
          </p>
        </div>
      </div>
      <SectionTitle
        title="更大的探索地图"
        subtitle="未来方向 · 正在规划，当前课程尚未开放"
      />
      <div className="future-grid">
        {futureGuilds.map((g, i) => (
          <div key={g.name} className="future-card">
            <span className={`future-symbol color-${i % 4}`}>
              {["✧", "▥", "◈", "⌘"][i % 4]}
            </span>
            <div>
              <h3>{g.name}</h3>
              <p>{g.description}</p>
            </div>
            <Badge>规划中</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
export function GuildPage({ id }: { id: string }) {
  const { progress } = useWorkspace(),
    guild = guilds.find((g) => g.id === id);
  if (!guild)
    return (
      <Empty
        title="没有找到这个公会"
        text="先从现有的两个方向开始吧。"
        action={
          <button className="button primary" onClick={() => navigate("guilds")}>
            返回公会
          </button>
        }
      />
    );
  const list = lessons.filter((l) => l.guild === id),
    done = list.filter((l) => progress.completed.includes(l.id)).length;
  const stages = [
    "建立清晰的起点",
    "掌握基础工作方式",
    "做出可检查的成果",
    "让方法稳定复用",
    "完成自己的作品",
  ];
  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate("guilds")}>
        <ArrowLeft size={15} />
        全部学习公会
      </button>
      <div className={`guild-banner ${guild.color}`}>
        <div>
          <span className="eyebrow">{guild.en}</span>
          <h1>{guild.name}</h1>
          <p>{guild.description}</p>
          <div className="tag-list">
            {guild.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
        <img src={guild.image} alt="像素风公会场景" />
      </div>
      <div className="path-summary">
        <div>
          <span className="stat-icon green">
            <Flag size={20} />
          </span>
          <div>
            <strong>你的实践路线</strong>
            <p>完成检查清单，记录真正掌握的能力。</p>
          </div>
        </div>
        <div>
          <strong>
            {done}
            <span> / {list.length} 已完成</span>
          </strong>
          <ProgressBar value={(done / list.length) * 100} />
        </div>
        <button
          className="button secondary"
          onClick={() => navigate(`prompts/${id}`)}
        >
          <WandSparkles size={16} />
          配套提示词
        </button>
      </div>
      <div className="learning-layout">
        <div className="path-list">
          {[1, 2, 3, 4, 5].map((level) => (
            <section className="path-stage" key={level}>
              <div className="stage-label">
                <span>0{level}</span>
                <div>
                  <small>LEVEL {level}</small>
                  <h2>{stages[level - 1]}</h2>
                </div>
              </div>
              <div className="stage-lessons">
                {list
                  .filter((l) => l.level === level)
                  .map((lesson) => {
                    const complete = progress.completed.includes(lesson.id);
                    const checks = progress.checks[lesson.id]?.length || 0;
                    return (
                      <button
                        className={`lesson-row ${complete ? "complete" : ""}`}
                        key={lesson.id}
                        onClick={() => navigate(`lesson/${lesson.id}`)}
                      >
                        <span className="lesson-status">
                          {complete ? (
                            <Check size={18} />
                          ) : (
                            <BookOpen size={18} />
                          )}
                        </span>
                        <div>
                          <div className="lesson-title">
                            <h3>{lesson.title}</h3>
                            {complete ? (
                              <Badge tone="sage">已完成</Badge>
                            ) : checks > 0 ? (
                              <Badge tone="orange">进行中</Badge>
                            ) : null}
                          </div>
                          <p>{lesson.subtitle}</p>
                          <div className="lesson-meta">
                            <Clock3 size={13} />
                            {lesson.minutes} 分钟<span>·</span>
                            {lesson.category}
                          </div>
                        </div>
                        <ArrowRight size={17} />
                      </button>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
        <aside className="path-aside" aria-label="学习方式说明">
          <span className="eyebrow">LEARN BY DOING</span>
          <h3>
            不是看完，
            <br />
            而是做到。
          </h3>
          <p>
            每个节点都包含方法、实际练习与成果检查。可以自由选择顺序，也可以从第一步稳稳出发。
          </p>
          <div className="aside-rule">
            <Target size={20} />
            <span>先读清楚预期成果</span>
          </div>
          <div className="aside-rule">
            <WandSparkles size={20} />
            <span>带着材料进行实践</span>
          </div>
          <div className="aside-rule">
            <CheckCheck size={20} />
            <span>逐项检查，记录收获</span>
          </div>
          <button className="text-link" onClick={() => navigate("team")}>
            把学习变成小队任务
            <ArrowRight size={15} />
          </button>
        </aside>
      </div>
    </div>
  );
}
export function LessonPage({ id }: { id: string }) {
  const { progress, mutate, memberId, busy, toast } = useWorkspace(),
    lesson = lessons.find((l) => l.id === id);
  const [note, setNote, noteConflict, loadSavedNote, acknowledgeNoteSave] =
    useNoteDraft(memberId, id, progress.notes[id] || "");
  if (!lesson)
    return (
      <Empty
        title="这篇教程暂不存在"
        text="返回学习公会，选择一个实践节点。"
        action={
          <button className="button primary" onClick={() => navigate("guilds")}>
            返回公会
          </button>
        }
      />
    );
  const checked = progress.checks[id] || [],
    complete = progress.completed.includes(id),
    all = checked.length === lesson.checklist.length;
  const list = lessons.filter((l) => l.guild === lesson.guild),
    next = list[list.findIndex((l) => l.id === id) + 1];
  const toggleCheck = (index: number) => {
    const checks = checked.includes(index)
      ? checked.filter((i) => i !== index)
      : [...checked, index];
    const completed =
      checks.length === lesson.checklist.length
        ? progress.completed
        : progress.completed.filter((key) => key !== id);
    void mutate(`progress/${memberId}`, "PATCH", {
      checks: { [id]: checks },
      completed,
    });
  };
  const finish = async () => {
    if (!all && !complete) {
      toast("先完成右侧成果检查，再记录完成。");
      return;
    }
    if (
      await mutate(`progress/${memberId}`, "PATCH", {
        completed: complete
          ? progress.completed.filter((key) => key !== id)
          : [...progress.completed, id],
      })
    )
      toast(complete ? "已恢复为学习中" : "又掌握了一项真实能力，做得好！");
  };
  return (
    <div className="page lesson-page">
      <button
        className="back-link"
        onClick={() => navigate(`guild/${lesson.guild}`)}
      >
        <ArrowLeft size={15} />
        返回{lesson.guild === "general" ? "通用 AI 实践" : "游戏制作人"}
      </button>
      <div className="lesson-header">
        <div className="tag-list">
          <Badge tone="sage">实践节点 · LV.{lesson.level}</Badge>
          <Badge>{lesson.category}</Badge>
        </div>
        <h1>{lesson.title}</h1>
        <p>{lesson.subtitle}</p>
        <div className="lesson-meta">
          <Clock3 size={15} />
          {lesson.minutes} 分钟 <span>·</span>
          <BookOpen size={15} />
          学习 + 动手实践 <span>·</span>
          {complete ? "已完成" : "按自己的节奏探索"}
        </div>
      </div>
      <div className="lesson-layout">
        <article className="lesson-article">
          <div className="outcome-callout">
            <Target size={23} />
            <div>
              <span className="small-label">这次你会做出什么</span>
              <p>{lesson.outcome}</p>
            </div>
          </div>
          <h2 className="sr-only">实践准备</h2>
          <div className="preparation-grid">
            <div>
              <h3>开始前准备</h3>
              <ul>
                {lesson.prerequisites.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>会用到的工具</h3>
              <div className="tag-list">
                {lesson.tools.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          {lesson.sections.map((section, i) => (
            <section
              className="article-section"
              key={section.title}
              id={`section-${i}`}
            >
              <span className="section-number">0{i + 1}</span>
              <h2>{section.title}</h2>
              {section.body
                .split("\n")
                .filter(Boolean)
                .map((p, n) => (
                  <p key={n}>{p}</p>
                ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          <div className="exercise-box">
            <div>
              <Sparkles size={21} />
              <h2>现在，动手试一次</h2>
            </div>
            <p>{lesson.exercise}</p>
            {lesson.promptId ? (
              <button
                className="button primary"
                onClick={() => navigate(`prompt/${lesson.promptId}`)}
              >
                <WandSparkles size={16} />
                打开配套提示词
                <ArrowRight size={16} />
              </button>
            ) : null}
          </div>
          <div className="notes-section">
            <div className="section-title">
              <h2>
                <NotebookPen size={19} />
                我的实践笔记
              </h2>
              <Badge>仅当前成员</Badge>
            </div>
            <p className="note-draft-hint">
              草稿暂存在当前窗口；点击保存后写入工作区，也会包含在备份中。
            </p>
            {noteConflict ? (
              <div className="note-conflict" role="alert">
                <p>
                  另一窗口更新了这篇笔记。你的草稿已保留；可以载入新版本，或明确选择用草稿替换。
                </p>
                <button className="text-link" onClick={loadSavedNote}>
                  载入已保存的新版本
                </button>
              </div>
            ) : null}
            <label className="sr-only" htmlFor="lesson-note">
              实践笔记
            </label>
            <textarea
              id="lesson-note"
              value={note}
              maxLength={10000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记下你的成果链接、踩过的坑，或下一次可以改进的地方……"
              rows={5}
            />
            <button
              className="button secondary"
              disabled={busy || note === (progress.notes[id] || "")}
              onClick={async () => {
                if (
                  await mutate(`progress/${memberId}`, "PATCH", {
                    notes: { [id]: note },
                  })
                ) {
                  acknowledgeNoteSave(note);
                  toast("实践笔记已保存");
                }
              }}
            >
              {noteConflict ? "确认用草稿替换已保存版本" : "保存笔记"}
            </button>
          </div>
          <SourceList sources={lesson.sources} />
        </article>
        <aside className="lesson-checklist" aria-label="成果检查与本节目录">
          <div className="checklist-heading">
            <CheckCheck size={21} />
            <h3>成果检查</h3>
          </div>
          <p>亲自验证后，再勾选。进度会自动保存。</p>
          <ProgressBar
            value={(checked.length / lesson.checklist.length) * 100}
          />
          <span className="checklist-count">
            {checked.length} / {lesson.checklist.length} 项已验证
          </span>
          {lesson.checklist.map((text, i) => (
            <CheckRow
              key={text}
              checked={checked.includes(i)}
              disabled={busy}
              onChange={() => toggleCheck(i)}
            >
              {text}
            </CheckRow>
          ))}
          <button
            className={`button ${complete ? "secondary" : "primary"} full`}
            disabled={busy || (!complete && !all)}
            onClick={() => void finish()}
          >
            {complete ? (
              <>
                <Check size={16} />
                已完成 · 重新学习
              </>
            ) : (
              <>
                完成这个节点
                <Check size={16} />
              </>
            )}
          </button>
          {complete && next ? (
            <button
              className="button ghost full"
              onClick={() => navigate(`lesson/${next.id}`)}
            >
              下一个实践
              <ArrowRight size={15} />
            </button>
          ) : null}
          <div className="contents-list">
            <span className="eyebrow">本节目录</span>
            {lesson.sections.map((s, i) => (
              <a
                key={s.title}
                href={`#lesson/${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(`section-${i}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <ArrowDown size={12} />
                {s.title}
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
