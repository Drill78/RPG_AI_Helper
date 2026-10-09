import assert from "node:assert/strict";
import test from "node:test";
import {
  generalLessons,
  generalPrompts,
  generalTools,
} from "../src/content/general.ts";
import { gameLessons, gamePrompts, gameTools } from "../src/content/game.ts";

const lessons = [...generalLessons, ...gameLessons];
const prompts = [...generalPrompts, ...gamePrompts];
const tools = [...generalTools, ...gameTools];
const guilds = new Set(["general", "game"]);
const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));

function text(value, label) {
  assert.equal(typeof value, "string", `${label} must be text`);
  assert.ok(value.trim().length > 0, `${label} must not be blank`);
}

function distinctText(values, label) {
  assert.ok(
    Array.isArray(values) && values.length > 0,
    `${label} must have entries`,
  );
  values.forEach((value, index) => text(value, `${label}[${index}]`));
  assert.equal(
    new Set(values.map((value) => value.trim())).size,
    values.length,
    `${label} contains repeated entries`,
  );
}

function publicHttps(value, label) {
  text(value, label);
  const url = new URL(value);
  assert.equal(url.protocol, "https:", `${label} must use HTTPS`);
  assert.equal(
    url.username + url.password,
    "",
    `${label} must not embed credentials`,
  );
  assert.ok(url.hostname.includes("."), `${label} must have a public hostname`);
  assert.ok(
    !/^(?:localhost|127\.|0\.|example\.(?:com|org|net)$)/i.test(url.hostname),
    `${label} must not be a local or example URL`,
  );
  assert.ok(
    !/\.(?:invalid|test|localhost|example)$/i.test(url.hostname),
    `${label} must not be a reserved placeholder`,
  );
  assert.ok(
    !/\{\{|\}\}|<|>/.test(value),
    `${label} must not contain an unfilled placeholder`,
  );
}

test("content identities are unique across courses, recipes and tools", () => {
  const entries = [...lessons, ...prompts, ...tools];
  const ids = entries.map((entry) => entry.id);
  ids.forEach((id) => {
    text(id, "content id");
    assert.match(id, /^(general|game)-[a-z0-9-]+$/);
  });
  assert.equal(
    new Set(ids).size,
    ids.length,
    "duplicate IDs break saved progress and links",
  );
});

test("both guilds provide the full progression and enough reusable recipes", () => {
  assert.deepEqual(new Set(lessons.map((lesson) => lesson.guild)), guilds);
  assert.deepEqual(new Set(prompts.map((prompt) => prompt.guild)), guilds);
  for (const guild of guilds) {
    const guildLessons = lessons.filter((lesson) => lesson.guild === guild);
    assert.deepEqual(
      [...new Set(guildLessons.map((lesson) => lesson.level))].sort(),
      [1, 2, 3, 4, 5],
      `${guild} must include introductory and advanced outcomes`,
    );
    assert.ok(
      prompts.filter((prompt) => prompt.guild === guild).length >= 10,
      `${guild} needs at least 10 practical recipes`,
    );
  }
});

test("lessons teach an exercise and link to a recipe in the same guild", () => {
  for (const lesson of lessons) {
    text(lesson.title, `${lesson.id} title`);
    text(lesson.outcome, `${lesson.id} outcome`);
    text(lesson.exercise, `${lesson.id} exercise`);
    assert.ok(
      Number.isInteger(lesson.level) && lesson.level >= 1 && lesson.level <= 5,
      `${lesson.id} has an invalid level`,
    );
    assert.ok(
      Number.isFinite(lesson.minutes) && lesson.minutes > 0,
      `${lesson.id} has an invalid time estimate`,
    );
    assert.ok(
      lesson.sections.length > 0,
      `${lesson.id} has no teaching sections`,
    );
    lesson.sections.forEach((section) => {
      text(section.title, `${lesson.id} section title`);
      text(section.body, `${lesson.id} section body`);
    });
    distinctText(lesson.checklist, `${lesson.id} acceptance checklist`);
    text(lesson.promptId, `${lesson.id} promptId`);
    const prompt = promptById.get(lesson.promptId);
    assert.ok(
      prompt,
      `${lesson.id} links to a missing recipe: ${lesson.promptId}`,
    );
    assert.equal(
      prompt.guild,
      lesson.guild,
      `${lesson.id} links to another guild's recipe`,
    );
  }
});

test("recipe editors cover every template placeholder exactly once", () => {
  for (const prompt of prompts) {
    text(prompt.template, `${prompt.id} template`);
    const placeholders = [...prompt.template.matchAll(/\{\{([^{}]+)\}\}/g)].map(
      (match) => match[1],
    );
    assert.ok(
      placeholders.length > 0,
      `${prompt.id} should expose task-specific inputs`,
    );
    const keys = prompt.variables.map((variable) => variable.key);
    assert.equal(
      new Set(keys).size,
      keys.length,
      `${prompt.id} has duplicate variable fields`,
    );
    for (const variable of prompt.variables) {
      assert.match(
        variable.key,
        /^[A-Za-z_][A-Za-z0-9_]*$/,
        `${prompt.id} contains an invalid variable key`,
      );
      text(variable.label, `${prompt.id}.${variable.key} label`);
      text(variable.placeholder, `${prompt.id}.${variable.key} input guidance`);
    }
    assert.deepEqual(
      [...new Set(placeholders)].sort(),
      [...keys].sort(),
      `${prompt.id} template and editor fields do not match`,
    );
    const rendered = prompt.template.replace(/\{\{([^{}]+)\}\}/g, (_, key) => {
      assert.ok(keys.includes(key));
      return `TEST_VALUE_${key}`;
    });
    assert.ok(
      !rendered.includes("{{") && !rendered.includes("}}"),
      `${prompt.id} leaves malformed or unresolved placeholders`,
    );
  }
});

test("recipes include practical setup, checks and failure guidance", () => {
  for (const prompt of prompts) {
    distinctText(prompt.tools, `${prompt.id} tools`);
    distinctText(prompt.materials, `${prompt.id} materials`);
    distinctText(prompt.steps, `${prompt.id} steps`);
    distinctText(prompt.checks, `${prompt.id} checks`);
    distinctText(prompt.pitfalls, `${prompt.id} pitfalls`);
  }
});

test("all lessons and recipes provide labelled public HTTPS sources", () => {
  for (const entry of [...lessons, ...prompts]) {
    assert.ok(
      Array.isArray(entry.sources) && entry.sources.length > 0,
      `${entry.id} lacks sources`,
    );
    const urls = entry.sources.map((source) => source.url);
    assert.equal(
      new Set(urls).size,
      urls.length,
      `${entry.id} repeats the same source`,
    );
    for (const source of entry.sources) {
      text(source.title, `${entry.id} source title`);
      publicHttps(source.url, `${entry.id} source URL`);
    }
  }
});

test("tool entries point to usable URLs and known guilds", () => {
  for (const tool of tools) {
    text(tool.name, `${tool.id} name`);
    text(tool.description, `${tool.id} description`);
    text(tool.cost, `${tool.id} cost guidance`);
    text(tool.note, `${tool.id} usage note`);
    publicHttps(tool.url, `${tool.id} URL`);
    distinctText(tool.guilds, `${tool.id} guilds`);
    tool.guilds.forEach((guild) =>
      assert.ok(
        guilds.has(guild),
        `${tool.id} references unknown guild ${guild}`,
      ),
    );
  }
});
