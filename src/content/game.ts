import type { Lesson, PromptRecipe, Source, ToolItem } from "../types";

// 原创实践内容；官方资料与工具费用说明核查于 2026-10-09。
// 课程等级表示交付物阶段，预估时间表示本次练习时间，不是掌握整个领域所需时间。
const sources = {
  firstGame: {
    title: "Godot · 第一个 2D 游戏",
    url: "https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html",
  },
  scenes: {
    title: "Godot · 节点与场景",
    url: "https://docs.godotengine.org/en/stable/getting_started/step_by_step/nodes_and_scenes.html",
  },
  input: {
    title: "Godot · 输入动作与 InputMap",
    url: "https://docs.godotengine.org/en/stable/tutorials/inputs/input_examples.html",
  },
  signals: {
    title: "Godot · 使用信号",
    url: "https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html",
  },
  mainScene: {
    title: "Godot · 组织主游戏场景",
    url: "https://docs.godotengine.org/en/stable/getting_started/first_2d_game/05.the_main_game_scene.html",
  },
  debugger: {
    title: "Godot · 调试器面板",
    url: "https://docs.godotengine.org/en/stable/tutorials/scripting/debug/debugger_panel.html",
  },
  model: {
    title: "Godot · 模型导出注意事项",
    url: "https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/model_export_considerations.html",
  },
  blenderApply: {
    title: "Blender 4.5 · 应用变换",
    url: "https://docs.blender.org/manual/en/4.5/scene_layout/object/editing/apply.html",
  },
  blenderGltf: {
    title: "Blender 4.5 · glTF 材质与导出",
    url: "https://docs.blender.org/manual/en/4.5/addons/import_export/scene_gltf2.html",
  },
  versionControl: {
    title: "Godot · 版本控制与资源管理",
    url: "https://docs.godotengine.org/en/stable/tutorials/best_practices/version_control_systems.html",
  },
  lfs: {
    title: "GitHub · 使用 Git LFS 协作",
    url: "https://docs.github.com/en/repositories/working-with-files/managing-large-files/collaboration-with-git-large-file-storage",
  },
  accessibility: {
    title: "Microsoft · 游戏可访问性指南",
    url: "https://learn.microsoft.com/en-us/xbox/accessibility/guidelines",
  },
  contrast: {
    title: "Microsoft · 游戏画面对比度",
    url: "https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102",
  },
  export: {
    title: "Godot · 导出可运行项目",
    url: "https://docs.godotengine.org/en/stable/tutorials/export/exporting_projects.html",
  },
  webExport: {
    title: "Godot · 网页导出与运行限制",
    url: "https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html",
  },
  unityBuild: {
    title: "Unity 6 · 创建和管理构建配置",
    url: "https://docs.unity3d.com/6000.0/Documentation/Manual/create-build-profile.html",
  },
  krita: { title: "Krita · 官方功能与下载", url: "https://krita.org/en/" },
  audacity: {
    title: "Audacity · 官方音频编辑工具",
    url: "https://www.audacityteam.org/",
  },
} satisfies Record<string, Source>;

export const gameLessons: Lesson[] = [
  {
    id: "game-brief",
    guild: "game",
    title: "把一个点子，缩成能完成的小游戏",
    subtitle: "先交付一页计划，再打开引擎。",
    level: 1,
    minutes: 25,
    category: "项目规划",
    outcome: "一张包含核心玩法、范围和验收条件的游戏计划卡。",
    prerequisites: ["一个想尝试的玩法；完全没有编程经验也可以开始"],
    tools: ["任意对话式 AI", "笔记工具"],
    sections: [
      {
        title: "先描述玩家的动作",
        body: "“做一个温暖的魔法世界”是氛围，“在 60 秒内移动篮子接住 10 颗星星，同时避开石头”才是可以实现、可以测试的玩法。把想法写成：玩家用什么操作，改变什么状态，得到什么反馈，何时结束。AI 可以帮你补全方案，但乐趣仍需要实际试玩。",
      },
      {
        title: "把范围锁在一个房间里",
        body: "第一次实践建议只做一个场景、一种主要操作、一种障碍和一轮完整流程。先使用圆形、方块和文字占位。联网、背包、复杂剧情、角色成长和商店都放进“以后再做”，直到一个朋友能独立玩完。",
        bullets: [
          "必做：开始、操作、目标、结算、重新开始。",
          "可选：一个音效、一段提示、一个美术主题。",
          "暂缓：第二种玩法、大地图、账号和付费功能。",
        ],
      },
      {
        title: "给 AI 一份可验收的委托",
        body: "提供你的时间、引擎经验、目标设备和现有素材，请 AI 把方案拆成 3 个独立可演示的阶段。例如第一阶段能移动，第二阶段能得分与失败，第三阶段能导出。每个阶段最多保留 3 个必须完成的动作。不要接受只写“优化体验”“完成美术”的任务。",
      },
    ],
    exercise:
      "用“60 秒接星星”或自己的点子写一页计划。请另一位成员只看计划，说出操作方式和获胜条件；说不清的地方继续删减。",
    checklist: [
      "一句话说清玩家操作和目标",
      "写下 3 项本版明确不做的内容",
      "每个阶段都有能当场演示的结果",
      "一位伙伴能复述玩法",
    ],
    promptId: "game-prompt-brief",
    sources: [sources.firstGame],
  },
  {
    id: "game-engine",
    guild: "game",
    title: "搭好工作台：引擎、场景与输入",
    subtitle: "只选一条路线，先让一个角色动起来。",
    level: 2,
    minutes: 40,
    category: "引擎入门",
    outcome: "一个能够运行、响应按键，并保存版本信息的空白原型。",
    prerequisites: ["完成一页游戏计划", "能安装并打开所选引擎"],
    tools: ["Godot 或 Unity", "任意对话式 AI"],
    sections: [
      {
        title: "选择能持续使用的那一款",
        body: "这条练习主线使用 Godot 4.x 与 GDScript 制作简单 2D 游戏。已有 Unity 经验可以沿用 Unity，不需要为学习 AI 再换引擎。记录实际编辑器版本、脚本语言和目标平台，将它们放在每次技术提问的开头；“Godot 4.x”只是系列名，排错时应补上完整版本号。",
      },
      {
        title: "用三个东西认识项目",
        body: "在 Godot 中，节点负责一项能力，场景把节点组合成可复用对象，主场景是游戏的启动入口。先建立 Main 场景，再建立 Player 场景，使用简单图形显示角色；将 Player 放入 Main。先运行当前场景检查角色，再运行整个项目确认入口正确。",
      },
      {
        title: "把按键命名为动作",
        body: "在 Project Settings 的 Input Map 中建立 move_left、move_right、move_up、move_down，绑定你希望使用的键。让 AI 根据实际节点树编写最小移动实现，并说明脚本应该挂在哪个节点。先确认连续按住、松开、反向和斜向四种情况；不要直接复制与自己节点类型不同的移动代码。",
        bullets: [
          "角色有碰撞需求时，让 AI 明确使用哪种物理节点及更新回调。",
          "速度应按时间计算；具体 API 是否需要 delta，要对照所用节点文档。",
          "截图里的节点名与代码中的路径必须一致。",
        ],
      },
    ],
    exercise:
      "用占位角色完成上下左右移动。关闭并重新打开项目，再从主入口运行一次；保存引擎版本和 Input Map 截图。",
    checklist: [
      "记录了实际引擎版本与脚本语言",
      "主场景可以独立启动",
      "四个方向按下和松开均符合预期",
      "连续运行没有未处理的错误",
    ],
    promptId: "game-prompt-engine",
    sources: [sources.scenes, sources.input, sources.unityBuild],
  },
  {
    id: "game-loop",
    guild: "game",
    title: "从会动的画面，到可玩的完整一局",
    subtitle: "开始 → 操作 → 反馈 → 结算 → 重试。",
    level: 3,
    minutes: 55,
    category: "玩法实现",
    outcome: "一个用占位素材也能连续玩三局的最小原型。",
    prerequisites: ["已有能移动的角色", "计划卡包含胜负条件"],
    tools: ["Godot 或 Unity", "任意对话式 AI"],
    sections: [
      {
        title: "先写出游戏的状态",
        body: "把一局游戏分为等待开始、进行中、已结束。等待时不计时，进行时才允许得分，结束后停下刷物和计时，再显示结果。先让 AI 给出状态转换表：什么事件让游戏从一个状态进入另一个状态，哪些数据需要重置。状态清楚后，再逐项实现。",
      },
      {
        title: "事件要有明确的接收者",
        body: "以接星星为例，星星报告“被接住”，主场景增加分数，界面显示新分数。Godot 的信号可以将这些事件连接起来，不必让每个对象都去修改其他对象。每次只接通一条链：先生成一颗星星，确认得分只增加一次，再加入定时生成。",
      },
      {
        title: "重试是最容易漏掉的一半",
        body: "重新开始时要清理上一局遗留对象、重置分数与时间、恢复角色位置、关闭旧的结算面板。第一次能玩完并不能证明流程完整。刻意测试快速双击开始、结束瞬间碰到目标、重复重试，检查是否出现双倍计分或越来越多的计时器。",
        bullets: [
          "一次结算只能触发一次。",
          "旧对象不能在新一局继续产生效果。",
          "失败之后，玩家应直接看到下一步怎么做。",
        ],
      },
    ],
    exercise:
      "录下三局连续体验：正常结束一局、故意失败一局、重新开始一局。每局都从开始界面进入，不依赖开发者手动重置。",
    checklist: [
      "玩家能看懂目标和操作",
      "得分或失败有可见反馈",
      "结束后停止当前局的活动",
      "连续重试三次仍能正常运行",
    ],
    promptId: "game-prompt-loop",
    sources: [sources.signals, sources.mainScene],
  },
  {
    id: "game-debug",
    guild: "game",
    title: "让 AI 帮你定位错误，而不是反复重写",
    subtitle: "报错原文、复现步骤和最小改动。",
    level: 3,
    minutes: 30,
    category: "协作编程",
    outcome: "修复一个真实问题，并留下可重复验证的排错记录。",
    prerequisites: ["一个可以复现的问题或不符合预期的行为"],
    tools: ["所选引擎的调试器", "任意代码助手", "Git"],
    sections: [
      {
        title: "先收集可以观察的事实",
        body: "写下预期行为、实际行为、最短复现步骤、完整错误文本、第一条相关堆栈和引擎版本。附上关联脚本以及对应节点树。截图可以帮助定位界面，但错误文本和代码最好直接粘贴；只发“它不动了”，AI 往往只能猜。",
      },
      {
        title: "一次验证一个假设",
        body: "要求 AI 给出最多 3 个可能原因，并为每个原因配一个检查动作。比如检查输入动作名是否拼错、节点引用是否为空、碰撞形状是否启用。用断点或临时日志观察变量，再根据结果选择修复。不要把第一个猜测直接当作结论。",
      },
      {
        title: "修复要能解释，也能撤回",
        body: "保存当前工作后，只修改与问题有关的代码。请 AI 指出更改位置、原因、影响范围和验证步骤。修复后除了重跑原问题，还检查之前能玩的核心流程。将“已测试”和“尚未测试”分开写；如果仍失败，把新日志带回同一段排错对话。",
      },
    ],
    exercise:
      "选择一个输入、计分或重试问题，写一份“问题—证据—改动—验证”记录。没有现成问题时，可在练习副本里故意拼错一个动作名，再完成定位。",
    checklist: [
      "有稳定复现问题的步骤",
      "保留了原始错误与环境版本",
      "能说明为什么这个改动解决问题",
      "原问题和一条相邻流程均已复测",
    ],
    promptId: "game-prompt-debug",
    sources: [sources.debugger, sources.input],
  },
  {
    id: "game-lowpoly",
    guild: "game",
    title: "做一个真正能放进游戏的低模道具",
    subtitle: "可选 3D 支线：参考图 → 建模 → 导出 → 引擎检查。",
    level: 3,
    minutes: 70,
    category: "3D 素材",
    outcome: "一个风格明确、比例正确，并在引擎中验证过的 .glb 静态道具。",
    prerequisites: [
      "会在 Blender 中选择、移动和缩放物体",
      "准备自己的或有使用权限的参考图",
    ],
    tools: ["Blender", "Godot", "任意对话式 AI"],
    sections: [
      {
        title: "先定义“低模”和“lofi”各指什么",
        body: "低模描述几何复杂度，lofi 描述整体视觉气质，两者并不等同于“像素”。先选简单静态道具，例如邮箱、路灯或小木屋；写清真实尺寸、镜头距离、色板和轮廓。为练习自定三角面预算，例如 300～1,500 面，并在最终游戏镜头下判断是否足够，不把这个范围当成行业统一标准。",
      },
      {
        title: "AI 帮你拆形体，Blender 负责生成和检查网格",
        body: "让 AI 把参考物拆成立方体、圆柱等基础形体，给出比例、命名、材质和操作顺序。手动完成块面造型，或在单独的空白文件中审阅并运行生成脚本。提示词本身不是 3D 文件；文生 3D 服务的结果也要检查孔洞、法线、拓扑和尺寸，不能直接宣称可商用或可交付。",
      },
      {
        title: "交付前做一次往返验证",
        body: "保存 .blend 源文件；对这个未绑定、未动画的静态道具，检查原点位置并应用旋转与缩放。使用简单可导出的材质，必要时把程序化效果烘焙成贴图。检查三角化结果后导出 .glb，放进引擎的测试场景，与一个已知尺寸的方块对比，再添加合适的碰撞体。",
        bullets: [
          "Blender 的复杂节点效果不保证完整进入 glTF。",
          "灯光与最终观感在引擎中再检查，不只看 Blender 渲染图。",
          "对已有骨骼或动画的资产，不照搬静态道具的应用变换步骤。",
        ],
      },
    ],
    exercise:
      "制作一个约 1 米高的 lofi 路边邮箱，保留正面与侧面截图、.blend 源文件、.glb 导出文件，以及引擎中的比例对照截图。",
    checklist: [
      "轮廓在实际游戏镜头下可辨认",
      "面数、尺寸、原点和命名已检查",
      "导出后材质与法线无明显异常",
      "引擎中已验证比例并配置碰撞",
    ],
    promptId: "game-prompt-lowpoly",
    sources: [sources.blenderApply, sources.blenderGltf, sources.model],
  },
  {
    id: "game-assets",
    guild: "game",
    title: "让素材像同一个游戏里的东西",
    subtitle: "一页风格规范，比十张漂亮但不搭的图更有用。",
    level: 4,
    minutes: 35,
    category: "素材整合",
    outcome: "一张素材规范表和三件通过场景对照的资源。",
    prerequisites: ["已有能玩的占位原型", "至少一张风格参考或目标截图"],
    tools: ["Krita 或 Blender", "Audacity", "所选引擎", "可选图像生成工具"],
    sections: [
      {
        title: "先做一个标准样件",
        body: "选择玩家最常看到的一件物品作为样件，固定色板、轮廓、明暗方向和细节密度。2D 资源额外记录画布尺寸、透明背景与游戏内显示大小；3D 资源记录单位比例、材质方式与面数预算。把样件放进引擎确认清晰之后，再扩展其余素材。",
      },
      {
        title: "生成是一轮候选，不是自动入库",
        body: "把同一份风格规范和参考图带给图像工具，每轮只改变对象，不同时改变视角、光照和材质。生成后在 Krita 中修理边缘、透明区域与尺寸，再导入场景。AI 对图像内容的评价只作辅助；是否接近同一风格，最终看它们并排出现时的实际效果。",
      },
      {
        title: "声音也要有共同的尺度",
        body: "为得分、受伤、按钮选择三个不同且短促的声音。用音频编辑工具裁掉无用静音，检查突兀接缝和过响片段，在游戏中试听连续触发。记录每个资源的来源、使用条件和修改方式；允许使用某个编辑器，不代表网上找到的素材都可以自由发布。",
      },
    ],
    exercise:
      "围绕同一个样件制作三个道具，并把得分音效放进游戏。截一张游戏实际画面，标出一个最不协调的资源并修正它。",
    checklist: [
      "所有资源使用同一份明确的风格规范",
      "三件资源已在同一场景和镜头下比较",
      "声音连续触发时没有明显刺耳或音量跳变",
      "资源来源及使用条件有记录",
    ],
    promptId: "game-prompt-style",
    sources: [sources.krita, sources.audacity, sources.blenderGltf],
  },
  {
    id: "game-team",
    guild: "game",
    title: "三个人协作，怎样避免互相覆盖",
    subtitle: "明确交付物、文件归属与可恢复的版本。",
    level: 4,
    minutes: 30,
    category: "项目协作",
    outcome: "一块可以执行的三人任务板，以及一次可恢复的版本快照。",
    prerequisites: [
      "已有原型和三名参与者",
      "项目已使用版本管理或先保存完整备份",
    ],
    tools: ["本应用任务面板", "Git 与 GitHub", "所选引擎"],
    sections: [
      {
        title: "按交付物分工",
        body: "一人负责玩法逻辑，一人负责素材与界面，一人负责试玩与发布检查。这是当前迭代的职责，可以轮换。每项任务写清负责人、输入、输出路径和验收动作，例如“完成三种星星素材，并在同一个场景展示”，比“负责美术”更容易协作。",
      },
      {
        title: "减少共享文件里的同时编辑",
        body: "开工前先同步项目，把高频修改对象拆成单独场景。尽量避免两个人同时改同一个主场景或 .blend 文件。提交前查看差异，只加入当前任务需要的文件。Godot 4.1 及以后通常应忽略 .godot 缓存；具体忽略规则按项目版本生成，并确认没有把真正的源素材排除。",
      },
      {
        title: "大文件要让所有成员都能拿到",
        body: "大型模型、音频和贴图需要单独规划存储。选择 Git LFS 时，每位成员的电脑都应安装并正确获取 LFS 资源，否则拿到的可能只是指针文件。先确定跟踪规则和存储额度，再提交大素材。每次合并后从主入口运行一次，确保“别人拉下来也能打开”。",
      },
    ],
    exercise:
      "在任务面板创建三个互不覆盖的任务，并设置一个“朋友可独立玩完一局”的共同目标。完成一次小修改、提交和重新打开项目检查。",
    checklist: [
      "每项任务只有一个当前负责人",
      "每项任务都有交付物和验证动作",
      "共享场景与大素材的编辑方式已约定",
      "一位成员能从同步后的项目正常运行",
    ],
    promptId: "game-prompt-sprint",
    sources: [sources.versionControl, sources.lfs],
  },
  {
    id: "game-playtest",
    guild: "game",
    title: "让别人试玩，观察真正卡住的地方",
    subtitle: "先看行为，再收集评价。",
    level: 4,
    minutes: 35,
    category: "试玩与体验",
    outcome: "一份有复现证据、优先级和修改建议的试玩报告。",
    prerequisites: ["能从开始界面玩到结算的版本", "一位没参与开发的试玩者"],
    tools: ["游戏运行版本", "笔记或录屏工具", "任意对话式 AI"],
    sections: [
      {
        title: "不要边试玩边替玩家操作",
        body: "只告诉对方“请打开并尝试玩完一局”，前几分钟先观察。记录他第一次操作、第一次得分、第一次停顿的位置。需要帮助时记下你说了什么；这些提示往往就是产品里缺失的引导。录屏前征得对方同意，也可以只做时间点笔记。",
      },
      {
        title: "检查信息是否有替代通道",
        body: "关掉声音再玩一次：是否仍能知道得分和失败？把画面缩小：关键文字是否还能读清？如果敌人与奖励仅靠红绿区分，补充不同形状、图标或文字。测试键盘是否能操作开始、暂停和重试；有明显镜头晃动时提供关闭选项。此练习是基础体验检查，不代表完成全部可访问性验证。",
      },
      {
        title: "把感受变成可以修的任务",
        body: "“不好玩”需要追问具体发生了什么。“第 20 秒出现石头，但玩家没看见”可以进一步检查提示、对比度和出生位置。请 AI 区分观察事实、试玩者原话和你的推测，再按阻碍程度排序：无法继续、容易误解、可以打磨。先修最影响完整一局的一个问题。",
      },
    ],
    exercise:
      "完成一次 10 分钟试玩，留下至少三个观察事实。选择其中一项修正，让同一位或另一位玩家重新尝试相同流程。",
    checklist: [
      "保存了具体行为记录而非只有评分",
      "测试了静音和关键文字可读性",
      "关键状态不只依赖颜色区分",
      "至少一个问题已经修复并复测",
    ],
    promptId: "game-prompt-playtest",
    sources: [sources.accessibility, sources.contrast],
  },
  {
    id: "game-demo",
    guild: "game",
    title: "交付第一份真正可试玩的 Demo",
    subtitle: "离开编辑器，在目标环境里完成最后一次检查。",
    level: 5,
    minutes: 45,
    category: "导出与交付",
    outcome: "一个可独立启动的试玩包或有效的网页试玩地址，以及清晰的说明。",
    prerequisites: ["最小流程已跑通并修复阻塞问题", "已决定第一种目标平台"],
    tools: ["Godot 或 Unity", "目标电脑或浏览器", "GitHub"],
    sections: [
      {
        title: "先只交付一个平台",
        body: "使用 Godot 时安装与编辑器匹配的导出模板，添加目标平台预设，并确认主场景正确。使用 Export Project 生成可玩版本；单独导出 PCK/ZIP 资源包不等于完整可执行程序。使用 Unity 6 时在 File → Build Profiles 中添加目标平台，安装缺失的平台模块，并检查构建场景。",
      },
      {
        title: "网页和桌面版本分别验证",
        body: "Godot 网页导出需要通过网页服务器提供文件，不能以双击本地 HTML 作为验收方式。检查所用语言、渲染方式与线程设置是否受目标平台支持；网页音频通常需要一次玩家交互才能开始。桌面版则将完整导出目录打包，移动到另一位置后重新打开，确认没有依赖开发机上的资源路径。",
      },
      {
        title: "交付说明也属于游戏的一部分",
        body: "写明版本号、目标系统、如何启动、操作方式、已知问题和反馈入口。请一位没有安装引擎的伙伴按说明独立尝试。记录真实测试设备和结果；只有启动、玩一局、重试都成功，才能把这个阶段标为完成。",
        bullets: [
          "保留当前源码对应的提交或版本快照。",
          "检查发布包中的素材署名与许可证要求。",
          "把“未测试的平台”明确列出，不承诺全平台兼容。",
        ],
      },
    ],
    exercise:
      "发布给内部伙伴一份 v0.1.0 试玩包，让他按说明完成一局并重试。收到确认或问题记录后，再勾选本节完成。",
    checklist: [
      "目标环境中可以独立启动",
      "完整一局和重试均已实际测试",
      "附有操作说明、版本号与已知问题",
      "伙伴的试玩反馈已记录",
    ],
    promptId: "game-prompt-release",
    sources: [sources.export, sources.webExport, sources.unityBuild],
  },
  {
    id: "game-iterate",
    guild: "game",
    title: "让第二个版本确实比第一个更好",
    subtitle: "每轮只解决一个主要问题，留下前后证据。",
    level: 5,
    minutes: 45,
    category: "迭代复盘",
    outcome: "一次已实施、已复测且可回退的小改动，以及有证据的版本记录。",
    prerequisites: ["已有可试玩的 Demo", "至少一份真实试玩记录"],
    tools: ["本应用任务面板", "任意对话式 AI", "版本管理工具"],
    sections: [
      {
        title: "按玩家遇到的困难选题",
        body: "把反馈收敛成一个主要问题，例如“第一次游玩的用户不知道石头会扣分”。提出最小改动：增加形状区分和一条首次提示，而不是立刻制作完整教学关卡。为修改写一个观察标准，例如下一次试玩者在第一次碰撞后，能说清石头的作用。",
      },
      {
        title: "保留前一版，比较同一条流程",
        body: "保存当前可玩的版本，再修改。用相同设备、相同窗口大小和相近的试玩条件检查新旧版本；如果关注性能，使用引擎分析工具记录，而不是凭“感觉流畅”。不要把只有两三位朋友的反馈当成统计结论，它足够指导小步改进，但仍需要后续验证。",
      },
      {
        title: "把本轮学到的内容存起来",
        body: "记录改了什么、为什么改、哪些测试通过、哪些问题还存在。把有用的 AI 对话压缩成可复用提示词，带上适用版本和必要输入。将新的任务放回面板，下一版最多先保留三项，等本轮目标兑现后再扩展玩法。",
      },
    ],
    exercise:
      "围绕一条真实反馈制作 v0.1.1 小迭代：先保存可回退的前一版，实际完成一项小改动，再按同一流程做前后比较，并执行三条回归检查。记录真实结果、剩余问题和效果不好时的回退办法。",
    checklist: [
      "本轮只有一个主要改进目标",
      "修改有可观察的成功标准",
      "保存了可回退的前一版",
      "已实施一项改动并完成前后比较及三条回归检查",
      "记录了已验证结果和剩余问题",
    ],
    promptId: "game-prompt-retro",
    sources: [sources.debugger, sources.versionControl, sources.accessibility],
  },
];

export const gamePrompts: PromptRecipe[] = [
  {
    id: "game-prompt-brief",
    guild: "game",
    title: "一页小游戏计划",
    summary: "把一个大点子裁成第一周能验证的小作品。",
    category: "项目规划",
    difficulty: "入门",
    minutes: 15,
    tags: ["范围控制", "项目起步", "Lv.1"],
    tools: ["任意对话式 AI"],
    materials: ["一句话点子", "可用时间和参与人数", "目标设备与已有技能"],
    steps: [
      "填入真实约束，先让 AI 提出最小版本。",
      "逐项确认必做内容，把不影响一局体验的功能移出首版。",
      "请另一位成员复述玩法，再保存最终的一页计划。",
    ],
    template: `你是一位重视小步交付的独立游戏制作教练。请把我的点子整理成一页可以执行的计划。

点子：{{idea}}
人员、时间与已有技能：{{resources}}
目标平台和偏好引擎：{{platform}}

请依次给出：
1. 一句话玩法：玩家做什么、得到什么反馈、何时胜利或失败。
2. 只含一个主要机制的最小版本，列出“必做 / 可选 / 本版不做”。
3. 三个可独立演示的阶段，每阶段注明交付物、预计工作量和验收动作。
4. 最少需要的工具与素材；能用几何图形占位的不要要求购买。
5. 最大的两项不确定性，以及最低成本的验证办法。

不要先写代码，也不要添加联网、背包、付费或成长系统。时间估计给出假设，不保证固定工期。信息不足时最多问三个关键问题，并提供可替换的默认假设。`,
    variables: [
      {
        key: "idea",
        label: "游戏点子",
        placeholder: "玩家做什么？",
        defaultValue:
          "【示例，请按实际情况替换】60 秒内用篮子接住星星，躲开落下的石头。",
      },
      {
        key: "resources",
        label: "人员与时间",
        placeholder: "人数、投入、已有经验",
        defaultValue:
          "【示例，请按实际情况替换】3 人，每人本周可投入 3 小时；一位有少量编程经验，另外两位负责素材和试玩。",
      },
      {
        key: "platform",
        label: "平台与引擎",
        placeholder: "例如 Windows / Godot",
        defaultValue:
          "【示例，请按实际情况替换】先交付 Windows 桌面 Demo；使用 Godot 4.x，具体版本在开工时记录。",
      },
    ],
    checks: [
      "计划包含完整的一局流程",
      "每个阶段的验收能现场执行",
      "明确至少三项本版不做的功能",
    ],
    pitfalls: [
      "把气氛描述当作玩法，遗漏操作和结束条件。",
      "把 AI 的工作量估计当成承诺；首次使用引擎要留调试时间。",
    ],
    sources: [sources.firstGame],
  },
  {
    id: "game-prompt-engine",
    guild: "game",
    title: "引擎上手操作单",
    summary: "根据实际版本、节点和目标，得到能逐步执行的操作。",
    category: "引擎入门",
    difficulty: "入门",
    minutes: 20,
    tags: ["Godot", "Unity", "场景与输入"],
    tools: ["所选游戏引擎", "任意对话式 AI"],
    materials: [
      "引擎完整版本",
      "当前场景树截图或文字",
      "这次只要实现的一个行为",
    ],
    steps: [
      "打开编辑器的版本信息，填入实际版本。",
      "先核对 AI 给出的节点结构和输入动作名，再按顺序操作。",
      "每完成一小步就运行一次，并保存结果或错误文本。",
    ],
    template: `请作为耐心的游戏引擎导师，帮助我完成一个最小练习。

引擎版本、语言及目标平台：{{environment}}
当前场景结构或项目状态：{{scene}}
本次目标：{{behavior}}

先检查信息是否足够，不要假装看到了没有提供的文件。请按以下格式回答：
- 需要的节点/对象及每项职责。
- 应在编辑器中设置的选项和输入动作名。
- 小步操作，每步只做一件事，并说明应看到什么。
- 必要代码及准确挂载位置，说明最关键的变量和回调。
- 验证清单：按下、持续按住、松开、反向与重新启动。

必须使用对应版本的 API；不确定时标记待查并提供官方文档入口。不要混用 Godot 3 与 4 的写法，或混用 Unity 的不同输入系统。不要增加与目标无关的插件。`,
    variables: [
      {
        key: "environment",
        label: "实际开发环境",
        placeholder: "填写完整版本、语言、平台",
        defaultValue:
          "【示例，请按实际情况替换】Godot 4.x（请替换为安装的完整版本），GDScript，Windows。",
      },
      {
        key: "scene",
        label: "当前场景",
        placeholder: "直接粘贴节点树",
        defaultValue:
          "【示例，请按实际情况替换】Main(Node2D) 下准备放置 Player；尚未添加脚本和 Input Map。",
      },
      {
        key: "behavior",
        label: "这次要实现的行为",
        placeholder: "保持目标尽量小",
        defaultValue:
          "【示例，请按实际情况替换】让一个占位角色用 WASD 移动，松开停止，斜向不应更快。",
      },
    ],
    checks: [
      "脚本挂载对象与继承类型匹配",
      "输入动作、节点名和代码路径完全一致",
      "实际运行了 AI 提供的验证步骤",
    ],
    pitfalls: [
      "只看代码，不做编辑器中的引用与输入设置。",
      "跨版本照搬 API，或没有说明正在使用的输入系统。",
    ],
    sources: [sources.scenes, sources.input],
  },
  {
    id: "game-prompt-loop",
    guild: "game",
    title: "最小可玩循环拆解",
    summary: "把开始、反馈、结算和重试接成一条完整流程。",
    category: "玩法实现",
    difficulty: "入门",
    minutes: 20,
    tags: ["状态设计", "任务拆解", "原型"],
    tools: ["任意代码助手", "Godot 或 Unity"],
    materials: ["一页游戏计划", "当前能运行的代码和场景结构", "胜负与计分规则"],
    steps: [
      "输入当前已有的能力和本次规则。",
      "先审查状态转换与重置清单，再让 AI 按一条事件链实现。",
      "用正常结束、失败和连续重试验证。",
    ],
    template: `请帮助我把原型补成一局完整的游戏。先设计和拆任务，不要一次重写整个项目。

引擎与当前已实现能力：{{current}}
玩法和计分/结束规则：{{rules}}

输出：
1. 等待开始、进行中、已结束的状态表，列出允许操作与转换事件。
2. 玩家、目标对象、主流程、界面各自负责什么，以及事件传递方向。
3. 按“先一件对象跑通，再扩展”的顺序给出最多 6 项任务。
4. 重新开始时必须清理和重置的数据清单。
5. 至少 6 个验收情境，包含双击开始、结束瞬间触发得分、连续重试。

每个任务给出输入、输出、成功画面和常见失败表现。对未知节点或文件使用明确占位说明，不编造我已有的结构。`,
    variables: [
      {
        key: "current",
        label: "当前实现",
        placeholder: "版本、语言、已完成的能力",
        defaultValue:
          "【示例，请按实际情况替换】Godot 4.x / GDScript，已经有可移动的篮子和一个占位星星；还没有开始界面、计时和结算。",
      },
      {
        key: "rules",
        label: "玩法规则",
        placeholder: "得分、失败、结束条件",
        defaultValue:
          "【示例，请按实际情况替换】接住星星加 1 分，碰到石头结束；正常坚持 60 秒也结束，展示得分并支持重新开始。",
      },
    ],
    checks: [
      "每个事件有唯一负责处理的对象",
      "结算后不再继续刷物或累计分数",
      "重试后没有上一局残留",
    ],
    pitfalls: [
      "多个对象同时修改分数，产生重复计分。",
      "只重置界面文字，却忘记计时器和场景中的旧对象。",
    ],
    sources: [sources.signals, sources.mainScene],
  },
  {
    id: "game-prompt-debug",
    guild: "game",
    title: "带证据的游戏报错诊断",
    summary: "用复现记录换取小而明确的修复建议。",
    category: "协作编程",
    difficulty: "进阶",
    minutes: 15,
    tags: ["调试", "代码审查", "最小改动"],
    tools: ["游戏引擎调试器", "任意代码助手"],
    materials: [
      "错误原文与首条相关堆栈",
      "关联代码和节点树",
      "预期、实际、复现步骤",
    ],
    steps: [
      "先保存当前可恢复版本。",
      "粘贴完整错误与最短复现步骤，让 AI 排列可能原因。",
      "完成一个检查动作后补充证据，只采纳已经得到支持的修复。",
      "运行原复现步骤和相邻核心流程，记录结果。",
    ],
    template: `请根据证据排查一个游戏问题，先诊断再给最小修复。

环境：{{environment}}
预期、实际行为与复现步骤：{{reproduction}}
错误原文、堆栈、关联代码与节点树：{{evidence}}

请：
1. 分开列出已知事实、未知信息和最多 3 个可能原因。
2. 每个原因给一个最小检查动作，以及不同结果分别说明什么。
3. 信息不足时先索取最关键的缺失信息；不要把猜测写成已确认原因。
4. 证据足够后，给出最小补丁、修改位置、原因和可能影响。
5. 提供原问题复测与回归检查步骤，并说明怎样撤回这次改动。

不要关闭警告或删除功能来掩盖错误；不要声称运行过你无法访问的项目。查不到的 API 明确标注。`,
    variables: [
      {
        key: "environment",
        label: "环境信息",
        placeholder: "版本、语言、操作系统",
      },
      {
        key: "reproduction",
        label: "怎样复现",
        placeholder: "预期 → 操作步骤 → 实际结果",
      },
      {
        key: "evidence",
        label: "错误与相关代码",
        placeholder: "粘贴原始错误和最小相关代码；不要放密码或密钥",
      },
    ],
    checks: [
      "诊断区分事实与假设",
      "修复范围能被解释并撤回",
      "已亲自执行修复后的复测",
    ],
    pitfalls: [
      "把整份项目反复重写，无法知道哪一处改变产生效果。",
      "只截最后一行错误，遗漏最先出现的根因。",
    ],
    sources: [sources.debugger],
  },
  {
    id: "game-prompt-lowpoly",
    guild: "game",
    title: "Lofi 低模道具制作配方",
    summary: "把参考图转为可操作的 Blender 建模与引擎验收方案。",
    category: "3D 素材",
    difficulty: "进阶",
    minutes: 45,
    tags: ["Blender", "低多边形", "glTF", "可选支线"],
    tools: ["Blender", "Godot", "任意对话式 AI"],
    materials: [
      "自有或已获授权的参考图",
      "道具实际尺寸与目标镜头",
      "色板、面数预算和目标文件格式",
    ],
    steps: [
      "先上传或描述参考图，填写资产约束。",
      "让 AI 分解基础形体，先做没有材质的轮廓样件。",
      "在 Blender 中完成建模；若用生成脚本，先审阅，在空白副本中运行。",
      "保存源文件并导出 .glb，放进引擎检查尺寸、材质和碰撞。",
    ],
    template: `你是一位游戏静态道具制作导师。我要制作一个 lofi 风格的低多边形模型，请输出真实可执行的制作配方。

道具与参考说明：{{asset}}
尺寸、轮廓、色板及面数预算：{{constraints}}
工具版本与最终用途：{{pipeline}}

请分阶段给出：
1. 用基础几何体拆解道具，说明各部分比例与重要轮廓。
2. Blender 操作顺序、对象命名、原点建议和材质设置；先完成静态无骨骼版本。
3. 导出准备：保存源文件，检查旋转/缩放、三角化与材质兼容，再导出目标格式。
4. 引擎验收：与已知尺寸物体比较、检查正反面与贴图、配置简化碰撞、在目标镜头观察。
5. 常见失败表现及排查动作。

明确区分“文字方案”“可运行建模脚本”“实际导出的网格文件”。不要宣称仅凭这段提示已生成成品；不要把渲染图当作网格交付。若建议脚本，先解释它创建和修改哪些对象，不删除现有项目内容，不调用外部网络。`,
    variables: [
      {
        key: "asset",
        label: "道具与参考",
        placeholder: "上传参考图后说明要保留的特点",
        defaultValue:
          "【示例，请按实际情况替换】一个圆顶乡村邮箱，有短支架和小旗子；轮廓朴素，不使用复杂花纹。",
      },
      {
        key: "constraints",
        label: "资产规范",
        placeholder: "尺寸、色板、面数、镜头距离",
        defaultValue:
          "【示例，请按实际情况替换】约 1 米高；暖白、砖红、深灰三色；练习预算 800 个三角面以内；俯视中景使用。",
      },
      {
        key: "pipeline",
        label: "制作与使用环境",
        placeholder: "填写实际版本和目标格式",
        defaultValue:
          "【示例，请按实际情况替换】Blender（填写安装版本）→ .glb → Godot 4.x；静态环境道具，无骨骼动画。",
      },
    ],
    checks: [
      "Blender 源文件与导出文件都已保存",
      "实际统计面数并检查尺度、原点和法线",
      "在引擎中验证了材质与碰撞",
    ],
    pitfalls: [
      "“low poly”不等于像素风，必须写清视觉和几何约束。",
      "复杂程序化材质未烘焙，导入后只剩默认颜色。",
      "将静态道具的变换步骤直接用于已经绑定的角色。",
    ],
    sources: [sources.blenderApply, sources.blenderGltf, sources.model],
  },
  {
    id: "game-prompt-style",
    guild: "game",
    title: "一套游戏素材的风格规范",
    summary: "统一视觉、尺寸和命名，让每次生成都有同一个参照。",
    category: "素材整合",
    difficulty: "入门",
    minutes: 20,
    tags: ["风格一致", "素材规格", "图像提示词"],
    tools: ["任意对话式 AI", "Krita 或 Blender", "可选图像生成工具"],
    materials: [
      "一个认可的标准样件",
      "游戏实际截图或镜头描述",
      "本轮需要的素材列表",
    ],
    steps: [
      "选择一个标准样件，不同时混合多个差异很大的参考。",
      "生成可测量的风格规范，再为各个对象生成提示词。",
      "只先制作一件候选，放进引擎比较后修订规范。",
      "保留通过验收的提示词、参考与导出参数。",
    ],
    template: `请为我的小游戏建立一页素材风格规范，并据此编写可复用的图像或建模提示词。

游戏与镜头：{{context}}
标准样件或参考的具体特征：{{reference}}
本轮素材列表：{{assets}}

输出：
- 共同规则：色板、轮廓、光照方向、视角、细节密度、禁止混入的视觉元素。
- 文件规则：根据 2D/3D 分别建议画布或单位尺寸、透明背景/材质要求、命名和导出格式，并标出待我确认的参数。
- 一段保持固定的公共提示词，以及每件素材单独替换的对象描述。
- 在同一游戏场景比较的验收清单。

看不到参考图片时只根据我的描述工作，明确说明。不要保证生成器每次输出一致；说明需要人工选择、修边和引擎内验证。资产许可要记录来源，不替来源作授权承诺。`,
    variables: [
      {
        key: "context",
        label: "游戏和镜头",
        placeholder: "2D/3D、视角、显示大小",
        defaultValue:
          "【示例，请按实际情况替换】2D 接星星小游戏，固定正视视角，目标物约占游戏画面宽度的 5%。",
      },
      {
        key: "reference",
        label: "样件特征",
        placeholder: "上传样件或具体描述",
        defaultValue:
          "【示例，请按实际情况替换】柔和暖黄色星星，清晰圆润轮廓，左上受光，深色细描边，透明背景。",
      },
      {
        key: "assets",
        label: "素材列表",
        placeholder: "本轮只列少量素材",
        defaultValue:
          "【示例，请按实际情况替换】普通星星、奖励星星、危险石头；危险物要有独立形状，不能只靠颜色区分。",
      },
    ],
    checks: [
      "规范包含尺寸、视角与具体视觉规则",
      "每件素材只替换必要的对象特征",
      "候选资源已在真实游戏画面中检查",
    ],
    pitfalls: [
      "不同批次随意换色板、镜头和光照。",
      "提示词只写“高级、精美、统一”，没有可执行的参数。",
    ],
    sources: [sources.krita, sources.model, sources.contrast],
  },
  {
    id: "game-prompt-sprint",
    guild: "game",
    title: "三人小队迭代分工",
    summary: "让每个人都知道这轮交什么、怎样算完成。",
    category: "项目协作",
    difficulty: "进阶",
    minutes: 15,
    tags: ["任务面板", "三人协作", "共同目标"],
    tools: ["任意对话式 AI", "本应用任务面板", "Git 与 GitHub"],
    materials: [
      "本轮唯一主要目标",
      "三人的时间与特长",
      "当前项目状态和共享文件",
    ],
    steps: [
      "填写目标、人员与现状。",
      "检查 AI 是否把同一文件同时分给多人。",
      "将确认的任务手动放进任务面板，设置负责人和可执行的检查项。",
      "在集成节点一起从主入口运行。",
    ],
    template: `请把这轮小游戏迭代拆成适合 3 人内部协作的任务。

本轮目标：{{goal}}
三人的时间和特长：{{members}}
当前进度、阻塞与共享文件：{{state}}

先指出目标是否过大，再输出最多 6 个任务。每个任务包含：标题、唯一负责人、输入材料、交付物、修改文件或场景范围、依赖任务、预计时间、验收动作。
再给出两个集成检查节点，以及发生冲突或进度落后时优先裁掉的内容。

避免同时安排多人修改同一个主场景或不可合并的素材文件。大资源若需要 LFS，先提出准备事项，不假定所有成员已安装。不要生成虚假的完成状态，也不要把学习任务全部给一个人。`,
    variables: [
      {
        key: "goal",
        label: "本轮主要目标",
        placeholder: "一个可展示的结果",
        defaultValue:
          "【示例，请按实际情况替换】周末前让一位没有安装引擎的朋友独立玩完接星星 Demo。",
      },
      {
        key: "members",
        label: "成员与时间",
        placeholder: "名字、特长、可用时间",
        defaultValue:
          "【示例，请按实际情况替换】A：玩法代码，3 小时；B：画面素材与说明，3 小时；C：试玩记录与交付检查，2 小时。",
      },
      {
        key: "state",
        label: "当前项目状态",
        placeholder: "已完成、待做、容易冲突的文件",
        defaultValue:
          "【示例，请按实际情况替换】移动和得分已完成；缺结算重试和导出。主场景由 A 维护，素材单独放在 assets 目录。",
      },
    ],
    checks: [
      "每个任务有唯一负责人和明确交付物",
      "依赖顺序合理，没有互相等待",
      "至少一个节点要求集成后的实际试玩",
    ],
    pitfalls: [
      "只有“写代码/做美术/做测试”的笼统分工。",
      "任务各自完成却没有共同运行和合并检查。",
    ],
    sources: [sources.versionControl, sources.lfs],
  },
  {
    id: "game-prompt-playtest",
    guild: "game",
    title: "十分钟试玩观察与复盘",
    summary: "从真实行为找问题，输出可以修复的任务。",
    category: "试玩与体验",
    difficulty: "入门",
    minutes: 15,
    tags: ["用户测试", "可访问性", "反馈整理"],
    tools: ["任意对话式 AI", "游戏运行版本", "笔记工具"],
    materials: [
      "版本号与目标平台",
      "真实观察记录或玩家原话",
      "本次最想验证的一件事",
    ],
    steps: [
      "先写测试目标，让 AI 给出中性的观察步骤。",
      "请试玩者独立开始，记录停顿与求助，不诱导好评。",
      "将实际笔记填入模板，区分事实与推测。",
      "选择最高优先级问题，修复后复测。",
    ],
    template: `你是游戏体验研究助手。请为这次 10 分钟内部试玩制定观察方案，并整理我提供的真实记录。

版本与玩法：{{game}}
重点验证的问题：{{question}}
实际观察与玩家原话：{{notes}}

如果记录尚为空，先给出测试步骤和记录表，不虚构测试结果。
如果已有记录，分别整理“观察事实 / 玩家原话 / 可能解释 / 待验证问题”，再给最多 5 项改进建议。
每项建议注明阻碍程度、原始证据、最小修改和复测方式。包含基础检查：静音时的反馈、文字可读性、颜色之外的状态提示、关键菜单操作。
不要用少量朋友样本推断全部玩家，不把建议当成已通过的可访问性认证。`,
    variables: [
      {
        key: "game",
        label: "版本与玩法",
        placeholder: "版本、平台、主要操作",
        defaultValue:
          "【示例，请按实际情况替换】v0.1.0 / Windows，左右移动篮子接星星，碰到石头或 60 秒结束。",
      },
      {
        key: "question",
        label: "本次验证重点",
        placeholder: "一次只选一个重点",
        defaultValue:
          "【示例，请按实际情况替换】第一次接触的用户，能否不经口头指导完成一局并重新开始？",
      },
      {
        key: "notes",
        label: "实际试玩记录",
        placeholder: "时间点、行为、原话；没测试就留空",
      },
    ],
    checks: [
      "报告没有虚构观察或样本数",
      "每项高优先级问题都能追溯到证据",
      "改进包含具体复测动作",
    ],
    pitfalls: [
      "边讲解边操作，导致无法观察真实理解成本。",
      "把“喜欢/不喜欢”直接转换成大改版，而没有定位具体原因。",
    ],
    sources: [sources.accessibility, sources.contrast],
  },
  {
    id: "game-prompt-release",
    guild: "game",
    title: "Demo 交付检查与说明",
    summary: "把编辑器里的成果变成朋友真正能启动的版本。",
    category: "导出与交付",
    difficulty: "进阶",
    minutes: 20,
    tags: ["导出", "发布说明", "Lv.5"],
    tools: ["Godot 或 Unity", "任意对话式 AI", "目标设备"],
    materials: [
      "引擎完整版本与脚本语言",
      "目标平台、导出错误或日志",
      "真实测试结果与已知问题",
    ],
    steps: [
      "明确一个目标平台，先完成一次最小导出。",
      "根据输出准备模板、模块或网页服务器等必要条件。",
      "在另一目录或目标设备按清单实际测试。",
      "把已测结果填回模板，生成真实的交付说明。",
    ],
    template: `请帮助我准备一份小游戏 Demo 的内部交付。

开发环境与目标：{{environment}}
当前导出状态、日志或错误：{{build}}
真实测试结果和已知问题：{{tested}}

请输出：
1. 与该版本和目标平台相符的导出准备清单，区分资源包与可运行版本。
2. 当前错误的排查顺序；没有错误则列出容易遗漏的验证。
3. 启动 → 开始 → 一局结束 → 重试 → 退出的实测清单。
4. 一份简明试玩说明：版本、目标平台、启动方式、操作、已知问题、未测试范围和反馈格式。

网页版本要检查托管方式、音频启动和该引擎版本的导出限制；桌面版本要检查完整文件与相对路径。只把我已实际提供的测试标成通过。不虚构下载链接，不承诺所有设备兼容。`,
    variables: [
      {
        key: "environment",
        label: "开发环境与目标",
        placeholder: "完整版本、语言、系统、输出形式",
        defaultValue:
          "【示例，请按实际情况替换】Godot 4.x（替换实际版本）/ GDScript；本次仅交付 Windows 桌面试玩包。",
      },
      {
        key: "build",
        label: "导出状态",
        placeholder: "已完成哪些设置？遇到什么报错？",
      },
      {
        key: "tested",
        label: "真实测试结果",
        placeholder: "设备、已测流程、尚未验证的部分",
        defaultValue:
          "【示例，请按实际情况替换】还没有测试独立运行的导出包，请把所有验收项标为待测。",
      },
    ],
    checks: [
      "真实目标环境中的完整一局已运行",
      "交付文件和启动说明相互匹配",
      "未测试范围与已知问题写得清楚",
    ],
    pitfalls: [
      "把编辑器内运行成功写成发布测试通过。",
      "只发送可执行文件，遗漏依赖数据；或把 PCK 资源包当作完整游戏。",
    ],
    sources: [sources.export, sources.webExport, sources.unityBuild],
  },
  {
    id: "game-prompt-retro",
    guild: "game",
    title: "从试玩反馈生成下一版",
    summary: "保留一个改进目标，给出证据、范围与回退办法。",
    category: "迭代复盘",
    difficulty: "进阶",
    minutes: 15,
    tags: ["版本迭代", "复盘", "优先级"],
    tools: ["任意对话式 AI", "本应用任务面板", "版本管理工具"],
    materials: ["当前可玩的版本", "真实试玩反馈", "下一轮时间预算"],
    steps: [
      "把反馈按原始记录贴入，避免先替 AI 下结论。",
      "选一个最影响体验且本轮可解决的问题。",
      "明确前后比较方式，再拆成最多三项任务。",
      "修复并复测后记录结果，不满足目标则继续缩小问题。",
    ],
    template: `请根据真实试玩反馈规划下一版小游戏，保持改动可验证、可回退。

当前版本与核心流程：{{version}}
反馈与证据：{{feedback}}
本轮人员、时间和限制：{{budget}}

先分清事实与推测，再推荐一个最值得优先解决的问题。输出：
- 主要目标及其可观察的成功标准。
- 最小修改方案和明确不做的内容。
- 最多三项任务，各有交付物、负责人角色和验收动作。
- 新旧版本的比较办法，以及三条必须保留通过的回归检查。
- 版本说明草稿与回退条件。

不要为了回应每条反馈而增加大量功能。少量样本只用于本轮改进，不写成统计结论；没有实测的数据使用“待验证”。`,
    variables: [
      {
        key: "version",
        label: "当前版本",
        placeholder: "版本与已有功能",
        defaultValue:
          "【示例，请按实际情况替换】v0.1.0：接星星完整一局、失败结算和重试均可运行。",
      },
      {
        key: "feedback",
        label: "真实反馈",
        placeholder: "请填写实际记录，不要把示例当作测试结果",
      },
      {
        key: "budget",
        label: "本轮预算",
        placeholder: "人数、时间与不能改变的部分",
        defaultValue:
          "【示例，请按实际情况替换】3 人，每人 1 小时；保持核心玩法，不引入新插件或付费资源。",
      },
    ],
    checks: [
      "本轮目标对应明确的真实反馈",
      "改动范围符合时间预算",
      "有回归检查、比较方法和可回退版本",
    ],
    pitfalls: [
      "一次修改画面、操作、数值和流程，无法判断改善来自哪里。",
      "把没有复测的建议直接写进“已修复”。",
    ],
    sources: [sources.versionControl, sources.debugger],
  },
];

export const gameTools: ToolItem[] = [
  {
    id: "game-tool-godot",
    name: "Godot",
    category: "游戏引擎",
    description:
      "把场景、脚本、输入和素材组织成可运行游戏。本路线用它完成从 2D 原型到试玩 Demo 的完整流程。",
    url: "https://godotengine.org/",
    guilds: ["game"],
    cost: "免费开源 · MIT 许可",
    note: "先记录实际版本。本体免费；第三方素材、服务和部分平台的发布条件需另行确认。费用与许可信息核查：2026-10-09。",
  },
  {
    id: "game-tool-unity",
    name: "Unity",
    category: "游戏引擎",
    description:
      "适合已有 Unity 经验的团队继续制作 2D/3D 互动项目。AI 提问时注明编辑器版本、输入系统与渲染管线。",
    url: "https://unity.com/products/unity-personal",
    guilds: ["game"],
    cost: "Personal 有条件免费 · 其他方案付费",
    note: "适用资格与第三方服务收费以官网当前条款为准。不要把 Personal 理解为所有团队和平台都无条件免费。核查：2026-10-09。",
  },
  {
    id: "game-tool-blender",
    name: "Blender",
    category: "3D 制作",
    description:
      "制作、修整和检查模型、材质与动画。用 AI 辅助拆解步骤，再由 Blender 生成并验证实际网格。",
    url: "https://www.blender.org/",
    guilds: ["game"],
    cost: "免费开源 · 可用于商业创作",
    note: "插件、模型和贴图可能有各自费用与许可。入门先制作简单静态道具，再导入引擎确认。核查：2026-10-09。",
  },
  {
    id: "game-tool-krita",
    name: "Krita",
    category: "2D 素材",
    description:
      "绘制概念图，修理 AI 生成素材的边缘、透明背景、色彩和尺寸，把候选图整理成可用资源。",
    url: "https://krita.org/en/",
    guilds: ["game"],
    cost: "官网桌面版免费开源",
    note: "部分商店发行渠道或扩展资源可能收费；下载方式与具体平台以官网为准。核查：2026-10-09。",
  },
  {
    id: "game-tool-audacity",
    name: "Audacity",
    category: "音频处理",
    description:
      "录音、裁剪、淡入淡出与音频格式转换。为按钮、得分和失败准备短音效，并实际检查播放接缝。",
    url: "https://www.audacityteam.org/",
    guilds: ["game"],
    cost: "本体免费开源",
    note: "可选插件、云服务和素材可能单独收费。音频编辑器的许可不等于录音或音乐的使用许可。核查：2026-10-09。",
  },
  {
    id: "game-tool-github",
    name: "GitHub",
    category: "版本与协作",
    description:
      "保存项目改动、讨论任务和管理可恢复的源码版本。配合 Git 使用，帮助三人小队明确每次交付。",
    url: "https://github.com/",
    guilds: ["general", "game"],
    cost: "提供免费方案 · 部分功能按量或订阅收费",
    note: "大素材使用 LFS 前先核对额度；每位成员都需正确获取实际资源。价格信息核查：2026-10-09。",
  },
];
