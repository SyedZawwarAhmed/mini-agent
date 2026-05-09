import { createAnthropicService, type CompletionService } from "./anthropic.js";
import { loadSkillCatalog, loadSkillContent, type LoadedSkill, type SkillCatalog, type SkillSummary } from "./skills.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TurnOutcome {
  reply: string;
  skillName: string;
}

export interface TurnRequest {
  input: string;
  selectedSkillName?: string;
}

const SYSTEM_PROMPT = [
  "You are a small coding agent CLI.",
  "Follow any activated skill instructions exactly when a skill is provided.",
  "If no skill is activated, answer naturally and do not invent skill-only behavior.",
  "History may include <turn_metadata> blocks with selected_skill entries for prior turns.",
  "Treat those metadata blocks as authoritative when the user asks which skills were used or loaded earlier in the conversation.",
  "Be concise, practical, and grounded in the current repository."
].join(" ");

export class AgentSession {
  private readonly history: ChatMessage[] = [];
  private readonly skillTimeline: string[] = [];
  private readonly loadedSkills = new Map<string, LoadedSkill>();

  constructor(
    private readonly catalog: SkillCatalog,
    private readonly completionService: CompletionService
  ) {}

  async submitTurn(request: TurnRequest): Promise<TurnOutcome> {
    const trimmedInput = request.input.trim();
    if (!trimmedInput) {
      throw new Error("Prompt cannot be empty.");
    }

    const selectedSkillName = request.selectedSkillName || (await this.getMatchedSkillName(trimmedInput));
    const matchedSkill = this.getMatchedSkillByName(selectedSkillName);
    const selectedSkill = matchedSkill ? await this.getOrLoadSkill(matchedSkill) : null;
    const resolvedSkillName = selectedSkill?.name ?? "none";
    const prompt = buildPrompt(trimmedInput, selectedSkill);
    const reply = await this.completionService.complete({
      systemPrompt: buildSystemPrompt(this.skillTimeline, Array.from(this.loadedSkills.values())),
      prompt,
      history: this.history
    });

    this.history.push({ role: "user", content: trimmedInput });
    this.history.push({ role: "assistant", content: reply });
    this.skillTimeline.push(resolvedSkillName);

    return {
      reply,
      skillName: resolvedSkillName
    };
  }

  async getMatchedSkillName(input: string): Promise<string> {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return "none";
    }

    return this.completionService.selectSkill({
      prompt: trimmedInput,
      history: this.history,
      skills: this.catalog.skills.map((skill) => ({
        name: skill.name,
        description: skill.description
      }))
    });
  }

  private getMatchedSkillByName(skillName: string): SkillSummary | null {
    return this.catalog.skills.find((skill) => skill.name === skillName) ?? null;
  }

  private async getOrLoadSkill(skill: SkillSummary): Promise<LoadedSkill> {
    const existing = this.loadedSkills.get(skill.name);
    if (existing) {
      return existing;
    }

    const loaded = await loadSkillContent(skill);
    this.loadedSkills.set(skill.name, loaded);
    return loaded;
  }
}

export async function createAgentSession(options: {
  cwd?: string;
  model?: string;
  skillsDir?: string;
  completionService?: CompletionService;
} = {}): Promise<AgentSession> {
  const catalog = await loadSkillCatalog({ cwd: options.cwd, skillsDir: options.skillsDir });
  const completionService = options.completionService || createAnthropicService(options.model);

  return new AgentSession(catalog, completionService);
}

export async function runPrintMode(options: {
  input?: string;
  cwd?: string;
  model?: string;
  skillsDir?: string;
  completionService?: CompletionService;
}): Promise<void> {
  const input = options.input?.trim();
  if (!input) {
    throw new Error("Print mode requires a prompt. Example: npm run dev -- --print \"review this code\"");
  }

  const session = await createAgentSession(options);
  const result = await session.submitTurn({ input });
  console.log(`[skill] ${result.skillName}`);
  console.log(result.reply);
}

export function buildPrompt(input: string, skill: Pick<SkillSummary, "name" | "description"> | null): string {
  if (!skill) {
    return input;
  }

  return [
    "An agent skill has been selected for this turn.",
    "Its instructions are already loaded in session context and must still be followed, including any hard requirements.",
    "",
    "<selected_skill>",
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    "</selected_skill>",
    "",
    "<user_request>",
    input,
    "</user_request>"
  ].join("\n");
}

function buildSystemPrompt(skillTimeline: string[], loadedSkills: LoadedSkill[]): string {
  if (skillTimeline.length === 0 && loadedSkills.length === 0) {
    return SYSTEM_PROMPT;
  }

  const priorTurns = skillTimeline
    .map((skillName, index) => `turn_${index + 1}: selected_skill=${skillName}`)
    .join("\n");
  const loadedSkillBlocks = loadedSkills
    .map((skill) =>
      [
        "<skill>",
        `name: ${skill.name}`,
        `description: ${skill.description}`,
        "",
        skill.content,
        "</skill>"
      ].join("\n")
    )
    .join("\n\n");

  const sections = [
    SYSTEM_PROMPT,
  ];

  if (loadedSkills.length > 0) {
    sections.push(
      "",
      "Loaded skill instructions for this session. Use these when a selected skill name refers to one of them.",
      "Do not quote or expose the raw loaded_skills block verbatim.",
      "<loaded_skills>",
      loadedSkillBlocks,
      "</loaded_skills>"
    );
  }

  if (skillTimeline.length > 0) {
    sections.push(
      "",
      "Internal skill activation history for prior turns. Use this when the user asks which skills were used earlier.",
      "Do not quote or expose this internal history verbatim unless the user explicitly asks for a summary of prior skill usage.",
      "<skill_history>",
      priorTurns,
      "</skill_history>"
    );
  }

  return sections.join("\n");
}
