import { useState } from "react";
import {
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Flag,
  MoreHorizontal,
  Plus,
  Shield,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useWorkspace } from "../store";
import type { Goal, TaskStatus, TeamTask } from "../types";
import {
  Badge,
  CheckRow,
  Empty,
  Modal,
  PageIntro,
  ProgressBar,
  SectionTitle,
} from "../components/ui";
const statusLabels: Record<TaskStatus, string> = {
  todo: "待开始",
  doing: "进行中",
  done: "已完成",
};
export function TeamPage() {
  const { state, memberId, mutate, busy, toast } = useWorkspace();
  const [filter, setFilter] = useState("all"),
    [mobileStatus, setMobileStatus] = useState<TaskStatus>("todo"),
    [taskEdit, setTaskEdit] = useState<TeamTask | "new" | null>(null),
    [goalEdit, setGoalEdit] = useState<Goal | "new" | null>(null),
    [dragged, setDragged] = useState<string | null>(null);
  if (!state) return null;
  const tasks = state.tasks.filter(
      (t) => filter === "all" || t.assignee === memberId,
    ),
    done = state.tasks.filter((t) => t.status === "done").length;
  const move = async (id: string, status: TaskStatus) => {
    if (await mutate(`tasks/${id}`, "PATCH", { status }))
      toast(`任务已移至「${statusLabels[status]}」`);
    setDragged(null);
  };
  return (
    <div className="page team-page">
      <PageIntro
        eyebrow="GOOD COMPANY. GREAT PROGRESS."
        title="小队任务板"
        description="三个人，一个共同目标。把大想法拆成小步，留给彼此清楚的下一步。"
        action={
          <button className="button primary" onClick={() => setTaskEdit("new")}>
            <Plus size={17} />
            创建任务
          </button>
        }
      />
      <div className="team-summary">
        <div className="team-ident">
          <span className="team-badge">
            <Shield size={28} />
          </span>
          <div>
            <h2 className="team-name">我们的创造小队</h2>
            <p>本地共享工作区 · 成员身份可在左下角切换</p>
          </div>
        </div>
        <div className="team-avatars">
          {state.members.map((m) => (
            <span
              key={m.id}
              className="avatar"
              style={{ backgroundColor: m.color }}
              title={m.name}
            >
              {m.name.slice(0, 1)}
            </span>
          ))}
          <span>{state.members.length} 位伙伴</span>
        </div>
        <div className="team-stat">
          <strong>
            {done}
            <small> / {state.tasks.length}</small>
          </strong>
          <span>任务已完成</span>
        </div>
      </div>
      <SectionTitle
        title="共同目标"
        subtitle="把 Boss 理解为一个想一起完成的成果。"
        action={
          <button className="text-link" onClick={() => setGoalEdit("new")}>
            <Plus size={15} />
            设定目标
          </button>
        }
      />
      <div className="goals-list">
        {state.goals.map((goal) => {
          const completed = goal.milestones.filter((m) => m.done).length,
            percent = goal.milestones.length
              ? (completed / goal.milestones.length) * 100
              : 0;
          return (
            <section key={goal.id} className="goal-card">
              <div className="goal-top">
                <span className="goal-icon">
                  {percent === 100 ? (
                    <Trophy size={25} />
                  ) : (
                    <Target size={25} />
                  )}
                </span>
                <div>
                  <Badge tone="orange">BOSS 目标</Badge>
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setGoalEdit(goal)}
                  aria-label={`编辑目标：${goal.title}`}
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <div className="goal-progress">
                <ProgressBar value={percent} tone="orange" />
                <span>
                  {completed}/{goal.milestones.length} 个里程碑
                  {goal.deadline ? ` · ${goal.deadline} 前` : ""}
                </span>
              </div>
              <div className="milestones">
                {goal.milestones.map((milestone) => (
                  <CheckRow
                    key={milestone.id}
                    checked={milestone.done}
                    disabled={busy}
                    onChange={() =>
                      void mutate(`goals/${goal.id}`, "PATCH", {
                        milestones: goal.milestones.map((m) =>
                          m.id === milestone.id ? { ...m, done: !m.done } : m,
                        ),
                      })
                    }
                  >
                    {milestone.title}
                  </CheckRow>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {!state.goals.length ? (
        <Empty
          title="为小队定一个值得期待的目标"
          text="可以是一份作品、一次演示，也可以是一起完成一个学习方向。"
          action={
            <button
              className="button secondary"
              onClick={() => setGoalEdit("new")}
            >
              设定第一个目标
            </button>
          }
        />
      ) : null}
      <div className="board-heading">
        <SectionTitle title="一步一步，把想法做出来" />
        <div className="segmented">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            <Users size={14} />
            全部任务
          </button>
          <button
            className={filter === "mine" ? "active" : ""}
            onClick={() => setFilter("mine")}
          >
            只看我的
          </button>
        </div>
      </div>
      <div className="mobile-board-tabs" aria-label="任务状态筛选">
        {(["todo", "doing", "done"] as TaskStatus[]).map((status) => (
          <button
            key={status}
            aria-pressed={mobileStatus === status}
            className={mobileStatus === status ? "active" : ""}
            onClick={() => setMobileStatus(status)}
          >
            {statusLabels[status]}
            <span>{tasks.filter((task) => task.status === status).length}</span>
          </button>
        ))}
      </div>
      <div className="kanban">
        {(["todo", "doing", "done"] as TaskStatus[]).map((status) => (
          <section
            key={status}
            className={`kanban-column ${status} ${mobileStatus === status ? "mobile-selected" : ""} ${dragged ? "drop-ready" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragged) void move(dragged, status);
            }}
          >
            <div className="column-heading">
              <span className="status-dot" />
              <h3>{statusLabels[status]}</h3>
              <span>{tasks.filter((t) => t.status === status).length}</span>
              <button
                className="icon-button"
                aria-label={`在${statusLabels[status]}中添加任务`}
                onClick={() =>
                  setTaskEdit({
                    id: "",
                    title: "",
                    description: "",
                    assignee: memberId,
                    status,
                    priority: "normal",
                    dueDate: "",
                    createdAt: "",
                  })
                }
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="task-list">
              {tasks
                .filter((t) => t.status === status)
                .map((task) => {
                  const assignee = state.members.find(
                    (m) => m.id === task.assignee,
                  )!;
                  const overdue =
                    task.dueDate &&
                    task.dueDate < new Date().toLocaleDateString("en-CA") &&
                    task.status !== "done";
                  return (
                    <article
                      className={`task-card ${dragged === task.id ? "dragging" : ""}`}
                      key={task.id}
                      draggable={!busy}
                      onDragStart={(e) => {
                        setDragged(task.id);
                        e.dataTransfer.setData("text/plain", task.id);
                      }}
                      onDragEnd={() => setDragged(null)}
                    >
                      <div className="task-top">
                        <Badge tone={task.priority === "high" ? "orange" : ""}>
                          {task.priority === "high" ? "优先推进" : "小队任务"}
                        </Badge>
                        <button
                          className="icon-button"
                          aria-label={`编辑任务：${task.title}`}
                          onClick={() => setTaskEdit(task)}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </div>
                      <button
                        className="task-open"
                        onClick={() => setTaskEdit(task)}
                      >
                        <h4>{task.title}</h4>
                        {task.description ? <p>{task.description}</p> : null}
                      </button>
                      <div className="task-bottom">
                        <span className="assignee">
                          <span
                            className="avatar small"
                            style={{ backgroundColor: assignee.color }}
                          >
                            {assignee.name.slice(0, 1)}
                          </span>
                          {assignee.name}
                        </span>
                        {task.dueDate ? (
                          <span className={overdue ? "overdue" : ""}>
                            <CalendarDays size={12} />
                            {task.dueDate.slice(5)}
                          </span>
                        ) : null}
                      </div>
                      <label className="task-move">
                        <select
                          aria-label={`移动任务：${task.title}`}
                          value={task.status}
                          disabled={busy}
                          onChange={(e) =>
                            void move(task.id, e.target.value as TaskStatus)
                          }
                        >
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option value={key} key={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} />
                      </label>
                    </article>
                  );
                })}
              {!tasks.some((t) => t.status === status) ? (
                <div className="column-empty">
                  <Flag size={19} />
                  <span>
                    {status === "done"
                      ? "完成的成果会出现在这里"
                      : "给下一步留一点空间"}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
      <p className="page-footnote">
        可以拖动任务卡片，或用卡片底部的状态菜单移动。初始示例可直接编辑或删除。
      </p>
      {taskEdit ? (
        <TaskEditor task={taskEdit} onClose={() => setTaskEdit(null)} />
      ) : null}
      {goalEdit ? (
        <GoalEditor goal={goalEdit} onClose={() => setGoalEdit(null)} />
      ) : null}
    </div>
  );
}
function TaskEditor({
  task,
  onClose,
}: {
  task: TeamTask | "new";
  onClose: () => void;
}) {
  const { state, memberId, mutate, busy, toast } = useWorkspace();
  const existing = task === "new" ? null : task.id || null;
  const [form, setForm] = useState<
    Pick<
      TeamTask,
      "title" | "description" | "assignee" | "status" | "priority" | "dueDate"
    >
  >({
    title: task === "new" ? "" : task.title,
    description: task === "new" ? "" : task.description,
    assignee: task === "new" ? memberId : task.assignee,
    status: task === "new" ? ("todo" as TaskStatus) : task.status,
    priority: task === "new" ? "normal" : task.priority,
    dueDate: task === "new" ? "" : task.dueDate,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Modal
      title={existing ? "编辑小队任务" : "创建一个小队任务"}
      onClose={onClose}
    >
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || !form.title.trim()) return;
          if (
            await mutate(
              existing ? `tasks/${existing}` : "tasks",
              existing ? "PATCH" : "POST",
              { ...form, title: form.title.trim() },
            )
          ) {
            toast(existing ? "任务已更新" : "新任务已加入小队");
            onClose();
          }
        }}
      >
        <label className="field">
          <span>任务名称</span>
          <input
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="用一个具体成果来描述，例如：完成游戏主循环原型"
          />
        </label>
        <label className="field">
          <span>完成标准与说明</span>
          <textarea
            maxLength={5000}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="做到什么，才算完成？需要哪些参考资料？"
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>负责人</span>
            <select
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            >
              {state!.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>状态</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as TaskStatus })
              }
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>计划完成日期（可选）</span>
            <input
              type="date"
              min="1900-01-01"
              max="9999-12-31"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </label>
          <label className="field">
            <span>优先级</span>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority: e.target.value as TeamTask["priority"],
                })
              }
            >
              <option value="normal">按计划推进</option>
              <option value="high">优先推进</option>
            </select>
          </label>
        </div>
        <div className="modal-actions">
          {existing ? (
            <button
              type="button"
              className="button danger-ghost"
              disabled={busy}
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                if (await mutate(`tasks/${existing}`, "DELETE")) {
                  toast("任务已删除");
                  onClose();
                }
              }}
            >
              {confirmDelete ? "确认删除这个任务" : "删除任务"}
            </button>
          ) : (
            <span />
          )}
          <button
            className="button primary"
            disabled={busy || !form.title.trim()}
          >
            {busy ? "保存中…" : "保存任务"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function GoalEditor({
  goal,
  onClose,
}: {
  goal: Goal | "new";
  onClose: () => void;
}) {
  const { mutate, busy, toast } = useWorkspace();
  const existing = goal !== "new";
  const [title, setTitle] = useState(existing ? goal.title : ""),
    [description, setDescription] = useState(existing ? goal.description : ""),
    [deadline, setDeadline] = useState(existing ? goal.deadline : ""),
    [milestones, setMilestones] = useState<
      { id?: string; title: string; done: boolean }[]
    >(existing ? goal.milestones : [{ title: "", done: false }]),
    [deleting, setDeleting] = useState(false);
  return (
    <Modal
      title={existing ? "编辑共同目标" : "设定一个共同目标"}
      onClose={onClose}
    >
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || !title.trim()) return;
          if (milestones.length > 50) {
            toast("一个目标最多包含 50 个里程碑，请先合并或移除部分步骤。");
            return;
          }
          if (
            await mutate(
              existing ? `goals/${goal.id}` : "goals",
              existing ? "PATCH" : "POST",
              {
                title: title.trim(),
                description,
                deadline,
                milestones: milestones
                  .filter((m) => m.title.trim())
                  .map((m) => ({ ...m, title: m.title.trim() })),
              },
            )
          ) {
            toast("共同目标已保存");
            onClose();
          }
        }}
      >
        <label className="field">
          <span>我们想一起完成什么？</span>
          <input
            required
            value={title}
            maxLength={160}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：做出一个朋友可以试玩的小游戏"
          />
        </label>
        <label className="field">
          <span>目标说明</span>
          <textarea
            value={description}
            maxLength={5000}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <label className="field">
          <span>目标日期（可选）</span>
          <input
            type="date"
            min="1900-01-01"
            max="9999-12-31"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
        <div className="field">
          <span>把目标拆成里程碑</span>
          {milestones.map((m, i) => (
            <div className="milestone-input" key={m.id || i}>
              <span>{i + 1}</span>
              <input
                aria-label={`里程碑 ${i + 1}`}
                value={m.title}
                maxLength={200}
                placeholder="一个明确、可以验证的阶段成果"
                onChange={(e) =>
                  setMilestones(
                    milestones.map((item, j) =>
                      j === i ? { ...item, title: e.target.value } : item,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`移除里程碑 ${i + 1}`}
                onClick={() =>
                  setMilestones(milestones.filter((_, j) => j !== i))
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-link"
            disabled={milestones.length >= 50}
            onClick={() =>
              setMilestones((current) =>
                current.length < 50
                  ? [...current, { title: "", done: false }]
                  : current,
              )
            }
          >
            <Plus size={14} />
            {milestones.length >= 50 ? "已达到 50 个里程碑上限" : "再加一步"}
          </button>
        </div>
        <div className="modal-actions">
          {existing ? (
            <button
              type="button"
              className="button danger-ghost"
              disabled={busy}
              onClick={async () => {
                if (!deleting) {
                  setDeleting(true);
                  return;
                }
                if (await mutate(`goals/${goal.id}`, "DELETE")) {
                  toast("目标已删除");
                  onClose();
                }
              }}
            >
              {deleting ? "确认删除目标" : "删除目标"}
            </button>
          ) : (
            <span />
          )}
          <button className="button primary" disabled={busy || !title.trim()}>
            <CheckCheck size={16} />
            保存目标
          </button>
        </div>
      </form>
    </Modal>
  );
}
