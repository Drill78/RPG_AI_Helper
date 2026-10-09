import { generalLessons, generalPrompts, generalTools } from "./general";
import { gameLessons, gamePrompts, gameTools } from "./game";
export const lessons = [...generalLessons, ...gameLessons];
export const prompts = [...generalPrompts, ...gamePrompts];
export const toolItems = [...generalTools, ...gameTools].filter(
  (t, i, all) => all.findIndex((item) => item.id === t.id) === i,
);
export const guilds = [
  {
    id: "general" as const,
    name: "通用 AI 实践",
    en: "THE EVERYDAY EXPLORER",
    description: "让 AI 成为你做事的好搭档。\n从清楚表达，到可复用的工作流。",
    color: "green",
    tags: ["高效提问", "信息整理", "工作流"],
    image: "/images/general-dark.png",
  },
  {
    id: "game" as const,
    name: "游戏制作人",
    en: "THE GAME MAKER",
    description:
      "把脑海里的世界，做成可以玩的作品。\n从第一份企划，到可试玩的 Demo。",
    color: "orange",
    tags: ["游戏企划", "原型开发", "美术资产"],
    image: "/images/game-dark.png",
  },
];
export const futureGuilds = [
  {
    name: "视觉设计师",
    description: "品牌视觉、插画与图像创作",
    icon: "palette",
  },
  { name: "影像创作者", description: "脚本、分镜、视频与后期", icon: "video" },
  {
    name: "研究与写作者",
    description: "文献整理、论证与长文写作",
    icon: "book",
  },
  { name: "数据分析师", description: "清洗、分析与可视化表达", icon: "chart" },
  {
    name: "网页与应用开发者",
    description: "从界面设计到可用工具",
    icon: "code",
  },
  {
    name: "教育工作者",
    description: "课程设计与个性化学习",
    icon: "graduation",
  },
  { name: "产品与运营", description: "用户洞察、策划与实验", icon: "target" },
  {
    name: "音乐与声音创作者",
    description: "音频创作、配乐与声音设计",
    icon: "music",
  },
  {
    name: "商务与电商",
    description: "客户沟通、商品内容与经营分析",
    icon: "briefcase",
  },
  {
    name: "自动化构建者",
    description: "连接工具，让重复任务自动完成",
    icon: "workflow",
  },
  {
    name: "翻译与本地化",
    description: "多语沟通、术语与文化适配",
    icon: "languages",
  },
  {
    name: "空间与产品设计",
    description: "概念探索、3D 表达与制造准备",
    icon: "box",
  },
];
