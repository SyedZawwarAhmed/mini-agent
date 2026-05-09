import path from "node:path";
import { promises as fs } from "node:fs";
import matter from "gray-matter";

const SKILL_NAME_PATTERN = /^[a-z0-9-]+$/;

export interface SkillSummary {
  name: string;
  description: string;
  filePath: string;
  rootPath: string;
}

export interface LoadedSkill extends SkillSummary {
  content: string;
}

export interface SkillCatalog {
  skills: SkillSummary[];
  roots: string[];
}

interface FrontmatterShape {
  name?: string;
  description?: string;
}

export async function loadSkillCatalog(options: { cwd?: string; skillsDir?: string } = {}): Promise<SkillCatalog> {
  const cwd = options.cwd || process.cwd();
  const roots = buildSkillRoots(cwd, options.skillsDir);
  const seen = new Set<string>();
  const skills: SkillSummary[] = [];

  for (const root of roots) {
    const discovered = await discoverSkillsInRoot(root);

    for (const skill of discovered) {
      if (seen.has(skill.name)) {
        continue;
      }

      seen.add(skill.name);
      skills.push(skill);
    }
  }

  return { skills, roots };
}

export async function loadSkillContent(skill: SkillSummary): Promise<LoadedSkill> {
  const raw = await fs.readFile(skill.filePath, "utf8");
  const parsed = matter(raw);

  return {
    ...skill,
    content: parsed.content.trim()
  };
}

function buildSkillRoots(cwd: string, skillsDir?: string): string[] {
  if (skillsDir) {
    return [path.resolve(cwd, skillsDir)];
  }

  return [
    path.join(cwd, ".skills"),
    path.join(cwd, ".commandcode", "skills"),
    path.join(cwd, ".agents", "skills")
  ];
}

async function discoverSkillsInRoot(rootPath: string): Promise<SkillSummary[]> {
  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    const skills: SkillSummary[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const folderPath = path.join(rootPath, entry.name);
      const skillPath = path.join(folderPath, "SKILL.md");
      const raw = await fs.readFile(skillPath, "utf8");
      const parsed = matter(raw);
      const frontmatter = parsed.data as FrontmatterShape;
      const name = frontmatter.name?.trim();
      const description = frontmatter.description?.trim();

      const skillCandidate = { folderName: entry.name, name, description, filePath: skillPath };
      validateSkill(skillCandidate);

      skills.push({
        name: skillCandidate.name,
        description: skillCandidate.description,
        filePath: skillPath,
        rootPath
      });
    }

    return skills;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function validateSkill(input: {
  folderName: string;
  name?: string;
  description?: string;
  filePath: string;
}): asserts input is {
  folderName: string;
  name: string;
  description: string;
  filePath: string;
} {
  if (!input.name) {
    throw new Error(`Skill at ${input.filePath} is missing a frontmatter "name".`);
  }

  if (!input.description) {
    throw new Error(`Skill "${input.name}" is missing a frontmatter "description".`);
  }

  if (input.name !== input.folderName) {
    throw new Error(`Skill name "${input.name}" must match its folder "${input.folderName}".`);
  }

  if (!SKILL_NAME_PATTERN.test(input.name)) {
    throw new Error(`Skill name "${input.name}" must use only lowercase letters, numbers, and hyphens.`);
  }
}
