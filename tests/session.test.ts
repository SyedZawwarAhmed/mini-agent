import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentSession, buildPrompt } from "../src/session.js";
import type { CompletionService } from "../src/anthropic.js";
import type { SkillCatalog } from "../src/skills.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await fs.rm(root, { recursive: true, force: true });
    })
  );
});

describe("session prompt assembly", () => {
  it("injects only the selected skill body", () => {
    const prompt = buildPrompt("Help me get started", {
      name: "welcome-me",
      description: "Help newcomers get started.",
      content: "Skill body"
    });

    expect(prompt).toContain("<selected_skill>");
    expect(prompt).toContain("name: welcome-me");
    expect(prompt).toContain("Skill body");
  });

  it("leaves the prompt untouched when no skill is selected", () => {
    expect(buildPrompt("What's the weather?", null)).toBe("What's the weather?");
  });

  it("loads the selected skill body and returns the matched skill name", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "mini-agent-session-"));
    tempRoots.push(root);
    const skillDir = path.join(root, ".skills", "welcome-me");
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, "SKILL.md"),
      `---
name: welcome-me
description: Help newcomers get started.
---
Use the welcome skill body.`,
      "utf8"
    );

    const complete = vi.fn<CompletionService["complete"]>().mockResolvedValue("response");
    const selectSkill = vi.fn<CompletionService["selectSkill"]>().mockResolvedValue("welcome-me");
    const session = new AgentSession(
      {
        roots: [],
        skills: [
          {
            name: "welcome-me",
            description: "Help newcomers get started.",
            filePath: path.join(skillDir, "SKILL.md"),
            rootPath: path.join(root, ".skills")
          }
        ]
      } satisfies SkillCatalog,
      { complete, selectSkill }
    );

    const previewSkill = await session.getMatchedSkillName("new to this project what should i do");
    const result = await session.submitTurn({ input: "new to this project what should i do", selectedSkillName: previewSkill });

    expect(previewSkill).toBe("welcome-me");
    expect(selectSkill).toHaveBeenCalledTimes(1);
    expect(result.skillName).toBe("welcome-me");
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete.mock.calls[0]?.[0].prompt).toContain("Use the welcome skill body.");
  });

  it("persists selected skill metadata into later model-visible history", async () => {
    const complete = vi
      .fn<CompletionService["complete"]>()
      .mockResolvedValueOnce("first response")
      .mockResolvedValueOnce("second response");
    const selectSkill = vi
      .fn<CompletionService["selectSkill"]>()
      .mockResolvedValueOnce("welcome-me")
      .mockResolvedValueOnce("none");

    const session = new AgentSession(
      {
        roots: [],
        skills: [
          {
            name: "welcome-me",
            description: "Help newcomers get started.",
            filePath: "/tmp/welcome-me/SKILL.md",
            rootPath: "/tmp"
          }
        ]
      } satisfies SkillCatalog,
      { complete, selectSkill }
    );

    const loadSkillContentSpy = vi.spyOn(await import("../src/skills.js"), "loadSkillContent");
    loadSkillContentSpy.mockResolvedValue({
      name: "welcome-me",
      description: "Help newcomers get started.",
      filePath: "/tmp/welcome-me/SKILL.md",
      rootPath: "/tmp",
      content: "Skill body"
    });

    await session.submitTurn({ input: "I am new to this project", selectedSkillName: "welcome-me" });
    await session.submitTurn({ input: "what skills have you loaded so far?", selectedSkillName: "none" });

    const secondCallHistory = complete.mock.calls[1]?.[0].history ?? [];
    expect(secondCallHistory).toEqual(
      expect.arrayContaining([
        {
          role: "assistant",
          content: expect.stringContaining("selected_skill: welcome-me")
        }
      ])
    );

    loadSkillContentSpy.mockRestore();
  });

  it("returns none when the llm chooses no skill", async () => {
    const session = new AgentSession(
      {
        roots: [],
        skills: []
      } satisfies SkillCatalog,
      {
        complete: vi.fn<CompletionService["complete"]>().mockResolvedValue("response"),
        selectSkill: vi.fn<CompletionService["selectSkill"]>().mockResolvedValue("none")
      }
    );

    await expect(session.getMatchedSkillName("what's the weather?")).resolves.toBe("none");
  });
});
