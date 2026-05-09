import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { loadSkillCatalog } from "../src/skills.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await fs.rm(root, { recursive: true, force: true });
    })
  );
});

describe("skills", () => {
  it("loads valid skills from .skills", async () => {
    const root = await createTempSkillProject({
      "welcome-me": `---
name: welcome-me
description: Help new people get started in this project.
---
Body`
    });

    const catalog = await loadSkillCatalog({ cwd: root });

    expect(catalog.skills).toHaveLength(1);
    expect(catalog.skills[0]?.name).toBe("welcome-me");
  });

  it("rejects a skill whose name does not match the folder", async () => {
    const root = await createTempSkillProject({
      "welcome-me": `---
name: wrong-name
description: Help new people get started in this project.
---
Body`
    });

    await expect(loadSkillCatalog({ cwd: root })).rejects.toThrow(/must match its folder/);
  });

  it("keeps welcome-me metadata available for llm-driven routing", async () => {
    const root = await createTempSkillProject({
      "welcome-me": `---
name: welcome-me
description: Help new people get started in this project.
---
Body`,
      "receiving-code-review": `---
name: receiving-code-review
description: Review code feedback for correctness, safety, and maintainability.
---
Body`
    });

    const catalog = await loadSkillCatalog({ cwd: root });
    expect(catalog.skills.map((skill) => skill.name).sort()).toEqual(["receiving-code-review", "welcome-me"]);
  });
});

async function createTempSkillProject(skills: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mini-agent-skills-"));
  tempRoots.push(root);
  const skillsRoot = path.join(root, ".skills");
  await fs.mkdir(skillsRoot, { recursive: true });

  await Promise.all(
    Object.entries(skills).map(async ([name, contents]) => {
      const skillDir = path.join(skillsRoot, name);
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, "SKILL.md"), contents, "utf8");
    })
  );

  return root;
}
