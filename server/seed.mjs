export function createSeedState(now = new Date().toISOString()) {
  const blank = () => ({ completed: [], checks: {}, bookmarks: [], notes: {} });
  const task = (id, title, description, assignee, priority = "normal") => ({
    id,
    title,
    description,
    assignee,
    status: "todo",
    priority,
    dueDate: "",
    createdAt: now,
  });
  return {
    version: 1,
    members: [
      {
        id: "drill",
        name: "Drill",
        role: "把想法变成可验证的作品",
        color: "#b6cbb5",
      },
      {
        id: "lin",
        name: "小林",
        role: "研究方法，也关心使用体验",
        color: "#d8bc9a",
      },
      {
        id: "an",
        name: "阿岚",
        role: "从一个小实验开始创作",
        color: "#b8b9d5",
      },
    ],
    progress: { drill: blank(), lin: blank(), an: blank() },
    tasks: [
      task(
        "starter-brief",
        "示例 · 写下我们要解决的真实问题",
        "这是可编辑的示例任务。选一个最近反复出现的小问题，写明使用者、输入材料、期待结果与判断结果好坏的标准。",
        "drill",
        "high",
      ),
      task(
        "starter-evidence",
        "示例 · 验证一次 AI 回答的来源",
        "选择一段带有事实判断的回答，回到原始资料核对，记录一处可信结论和一处需要修正的地方。",
        "lin",
      ),
      task(
        "starter-recipe",
        "示例 · 保存一个自己的常用提示词",
        "在提示词工坊选择配方，填入真实需求，去自己使用的 AI 工具中试跑，再根据结果调整并保存。",
        "an",
      ),
      task(
        "starter-game-plan",
        "示例 · 把游戏灵感缩成一页计划",
        "只保留一个核心玩法、一个可试玩场景和一个明确的结束条件。把暂不实现的内容写入后续清单。",
        "drill",
      ),
      task(
        "starter-assets",
        "示例 · 整理素材与使用边界",
        "列出试玩场景所需的图片、音效与模型；记录来源、格式和许可。未知授权的素材先用占位资源替代。",
        "an",
      ),
      task(
        "starter-playtest",
        "示例 · 约一次三人试玩复盘",
        "提前约定观察问题：玩家是否理解目标、是否完成核心操作、哪个步骤最容易卡住。用观察记录决定下一轮修改。",
        "lin",
      ),
    ],
    goals: [
      {
        id: "starter-first-project",
        title: "示例 · 一起完成第一个能展示的 AI 小项目",
        description:
          "这是你们可以直接修改的共同目标。项目可以是一份研究简报、一个实用工作流，或一段可试玩的游戏。用真实成果记录进展。",
        deadline: "",
        milestones: [
          {
            id: "starter-scope",
            title: "约定一个真实需求与验收标准",
            done: false,
          },
          {
            id: "starter-trial",
            title: "完成一次从输入到输出的完整试跑",
            done: false,
          },
          {
            id: "starter-review",
            title: "三人交叉检查结果并记录问题",
            done: false,
          },
          {
            id: "starter-refine",
            title: "改进并保存可重复使用的方法",
            done: false,
          },
        ],
      },
    ],
    savedPrompts: [],
  };
}
