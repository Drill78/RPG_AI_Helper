export type GuildId = "general" | "game";
export type Source = { title: string; url: string };
export type Lesson = {
  id: string;
  guild: GuildId;
  title: string;
  subtitle: string;
  level: number;
  minutes: number;
  category: string;
  outcome: string;
  prerequisites: string[];
  tools: string[];
  sections: { title: string; body: string; bullets?: string[] }[];
  exercise: string;
  checklist: string[];
  promptId?: string;
  sources: Source[];
};
export type PromptRecipe = {
  id: string;
  guild: GuildId;
  title: string;
  summary: string;
  category: string;
  difficulty: "入门" | "进阶";
  minutes: number;
  tags: string[];
  tools: string[];
  materials: string[];
  steps: string[];
  template: string;
  variables: {
    key: string;
    label: string;
    placeholder: string;
    defaultValue?: string;
  }[];
  checks: string[];
  pitfalls: string[];
  sources: Source[];
};
export type ToolItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  guilds: GuildId[];
  cost: string;
  note: string;
};
export type Member = { id: string; name: string; role: string; color: string };
export type TaskStatus = "todo" | "doing" | "done";
export type TeamTask = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  priority: "normal" | "high";
  dueDate: string;
  createdAt: string;
};
export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  milestones: { id: string; title: string; done: boolean }[];
};
export type SavedPrompt = {
  id: string;
  memberId: string;
  title: string;
  text: string;
  sourceId: string;
  createdAt: string;
};
export type Progress = {
  completed: string[];
  checks: Record<string, number[]>;
  bookmarks: string[];
  notes: Record<string, string>;
};
export type AppState = {
  version: 1;
  members: Member[];
  progress: Record<string, Progress>;
  tasks: TeamTask[];
  goals: Goal[];
  savedPrompts: SavedPrompt[];
};
