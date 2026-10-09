import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Check,
  Database,
  ExternalLink,
  Heart,
  Info,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useWorkspace } from "../store";
import type { AppState, Member } from "../types";
import {
  Badge,
  Modal,
  navigate,
  PageIntro,
  SectionTitle,
} from "../components/ui";
export function SettingsPage() {
  const { state, mutate, busy, toast } = useWorkspace(),
    input = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppState | null>(null),
    [filename, setFilename] = useState(""),
    [importRevision, setImportRevision] = useState(0);
  if (!state) return null;
  return (
    <div className="page settings-page">
      <PageIntro
        eyebrow="MAKE IT YOUR OWN"
        title="工作区与使用指南"
        description="照顾好你的学习记录，让每一次探索都有迹可循。"
      />
      <div className="settings-grid">
        <section className="settings-card">
          <SectionTitle
            title="小队成员"
            subtitle="这里是本地身份切换，不是联网账号登录。"
          />
          <div className="member-edit-list">
            {state.members.map((member) => (
              <MemberEditor
                key={JSON.stringify([
                  importRevision,
                  member.id,
                  member.name,
                  member.role,
                ])}
                member={member}
              />
            ))}
          </div>
        </section>
        <section className="settings-card">
          <span className="settings-icon">
            <Database size={23} />
          </span>
          <h2>记录留在你的电脑里</h2>
          <p>
            学习进度、笔记、收藏与小队任务保存到本地数据库。刷新页面不会丢失；更换电脑前，可以导出备份并在另一台运行本项目后导入。
          </p>
          <div className="backup-actions">
            <a
              href="/api/export"
              download
              className="button secondary"
              onClick={() => toast("正在导出工作区备份，请查看浏览器下载")}
            >
              <ArrowDownToLine size={16} />
              导出备份
            </a>
            <button
              className="button secondary"
              onClick={() => input.current?.click()}
            >
              <ArrowUpFromLine size={16} />
              导入备份
            </button>
          </div>
          <input
            className="sr-only"
            tabIndex={-1}
            type="file"
            aria-label="选择工作区备份文件"
            ref={input}
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 5 * 1024 * 1024)
                  throw new Error(
                    "文件超过 5 MB，请选择正常导出的工作区备份。",
                  );
                const data = JSON.parse(await file.text());
                const candidate =
                  data && typeof data === "object" ? data.state || data : null;
                if (
                  candidate?.version !== 1 ||
                  !Array.isArray(candidate.members) ||
                  !candidate.progress ||
                  !Array.isArray(candidate.tasks) ||
                  !Array.isArray(candidate.goals) ||
                  !Array.isArray(candidate.savedPrompts)
                )
                  throw new Error("这不是兼容的工作区备份。");
                setPendingImport(candidate);
                setFilename(file.name);
              } catch (e) {
                toast(e instanceof Error ? e.message : "无法读取备份");
              } finally {
                if (input.current) input.current.value = "";
              }
            }}
          />
          <div className="input-hint">
            <ShieldCheck size={16} />
            <span>导入会替换当前工作区数据，请先导出一份现有备份。</span>
          </div>
        </section>
      </div>
      <SectionTitle
        title="用一个真实任务开始"
        subtitle="不需要研究游戏规则，只要顺着你的目标走。"
      />
      <div className="guide-cards">
        {[
          {
            icon: BookOpen,
            title: "选一条路线",
            text: "在通用 AI 和游戏制作人中找到需要的能力。可以同时学习，也可以跳到当下需要的节点。",
            route: "guilds",
            button: "查看学习公会",
          },
          {
            icon: Sparkles,
            title: "带着材料动手做",
            text: "课程提供练习与完成标准。提示词工坊帮你整理输入，在自己的 AI 工具中执行并核验结果。",
            route: "prompts",
            button: "探索提示词工坊",
          },
          {
            icon: Users,
            title: "和伙伴一起推进",
            text: "把共同目标拆成里程碑，为每个任务指定负责人。切换成员时，每个人的学习记录保持独立。",
            route: "team",
            button: "打开小队任务板",
          },
        ].map((g, i) => (
          <section className="guide-card" key={g.title}>
            <span className="guide-number">0{i + 1}</span>
            <g.icon size={26} />
            <h3>{g.title}</h3>
            <p>{g.text}</p>
            <button className="text-link" onClick={() => navigate(g.route)}>
              {g.button}
              <ExternalLink size={13} />
            </button>
          </section>
        ))}
      </div>
      <div className="about-project">
        <div className="about-mark">✦</div>
        <div>
          <h2>
            行会 · AI 实践工作台 <Badge tone="sage">本地版 0.3</Badge>
          </h2>
          <p>
            从一个好问题，到一个真实作品。RPG 是熟悉的地图，实用能力才是目的地。
          </p>
          <div className="about-tags">
            <span>
              <Check size={14} />
              20 个学习节点
            </span>
            <span>
              <Check size={14} />
              20 份任务配方
            </span>
            <span>
              <Check size={14} />
              三人协作
            </span>
            <span>
              <Heart size={14} />
              像素风原创场景
            </span>
          </div>
        </div>
      </div>
      <section className="scope-note">
        <Info size={20} />
        <div>
          <h3>当前版本的边界与下一步</h3>
          <p>
            当前服务仅供这台电脑访问，没有公网账号、实时跨设备同步或内置 AI
            推理。三个成员是本地档案；提示词需要复制到外部工具执行。未来会围绕移动端、好友组队、更多职业内容和用户任务发布扩展，先保证这里的每一步真的有用。
          </p>
          <a
            href="https://github.com/Drill78/RPG_AI_Helper"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看项目仓库
            <ExternalLink size={13} />
          </a>
        </div>
      </section>
      {pendingImport ? (
        <Modal
          title="确认恢复工作区备份"
          onClose={() => setPendingImport(null)}
        >
          <div className="import-preview">
            <Database size={30} />
            <h3>{filename}</h3>
            <p>
              包含 {pendingImport.members.length} 位成员、
              {pendingImport.tasks.length} 个任务、{pendingImport.goals.length}{" "}
              个目标和 {pendingImport.savedPrompts.length} 份提示词笔记。
            </p>
            <p className="warning-text">
              恢复后将替换现有成员、任务、学习进度和笔记。服务器会再次校验文件；校验失败不会改动当前数据。
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setPendingImport(null)}
            >
              保留当前数据
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                if (await mutate("import", "POST", { state: pendingImport })) {
                  setImportRevision((value) => value + 1);
                  setPendingImport(null);
                  toast("工作区备份已恢复");
                }
              }}
            >
              确认恢复备份
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
function MemberEditor({ member }: { member: Member }) {
  const { mutate, busy, toast } = useWorkspace();
  const [name, setName] = useState(member.name),
    [role, setRole] = useState(member.role);
  return (
    <form
      className="member-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!name.trim() || !role.trim()) {
          toast("请填写成员名称和一句话介绍。");
          return;
        }
        if (
          await mutate(`members/${member.id}`, "PATCH", {
            name: name.trim(),
            role: role.trim(),
          })
        )
          toast("成员资料已更新");
      }}
    >
      <span className="avatar" style={{ backgroundColor: member.color }}>
        {member.name.slice(0, 1)}
      </span>
      <div>
        <label className="sr-only" htmlFor={`member-${member.id}`}>
          成员名称：{member.name}
        </label>
        <input
          id={`member-${member.id}`}
          aria-label={`成员名称：${member.name}`}
          value={name}
          maxLength={40}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <input
          aria-label={`成员介绍：${member.name}`}
          value={role}
          maxLength={100}
          required
          onChange={(e) => setRole(e.target.value)}
          placeholder="一句话介绍"
        />
      </div>
      <button
        className="button secondary"
        disabled={
          busy ||
          !name.trim() ||
          !role.trim() ||
          (name.trim() === member.name && role.trim() === member.role)
        }
      >
        保存
      </button>
    </form>
  );
}
