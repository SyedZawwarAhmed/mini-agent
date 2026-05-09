import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_MODEL = "claude-sonnet-4-5";

export interface CompletionInput {
  systemPrompt: string;
  prompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface SkillSelectionInput {
  prompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  skills: Array<{ name: string; description: string }>;
}

export interface CompletionService {
  complete(input: CompletionInput): Promise<string>;
  selectSkill(input: SkillSelectionInput): Promise<string>;
}

export function createAnthropicService(modelOverride?: string): CompletionService {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY. Set it in your environment before running the CLI.");
  }

  const client = new Anthropic({ apiKey });
  const model = modelOverride || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  return {
    async selectSkill(input: SkillSelectionInput): Promise<string> {
      if (input.skills.length === 0) {
        return "none";
      }

      const skillsText = input.skills
        .map((skill) => `- ${skill.name}: ${skill.description}`)
        .join("\n");

      const response = await client.messages.create({
        model,
        max_tokens: 32,
        system: [
          "You are selecting one agent skill for a user request.",
          "You will be given a list of available skills by name and description.",
          "Choose the single best skill for the latest user request, or choose none if no skill clearly fits.",
          "If the latest request is about being new to the project, codebase, repo, or repository, or asks what to do first or how to get started, choose welcome-me when that skill is available.",
          "Respond with only the exact skill name or the word none.",
          "Do not explain your choice."
        ].join(" "),
        messages: [
          ...input.history.map((message) => ({
            role: message.role,
            content: message.content
          })),
          {
            role: "user",
            content: [
              "<available_skills>",
              skillsText,
              "</available_skills>",
              "",
              "<latest_request>",
              input.prompt,
              "</latest_request>"
            ].join("\n")
          }
        ]
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim()
        .split(/\s+/)[0]
        ?.toLowerCase();

      const validSkill = input.skills.find((skill) => skill.name === text);
      return validSkill?.name ?? "none";
    },

    async complete(input: CompletionInput): Promise<string> {
      const response = await client.messages.create({
        model,
        max_tokens: 900,
        system: input.systemPrompt,
        messages: [
          ...input.history.map((message) => ({
            role: message.role,
            content: message.content
          })),
          {
            role: "user",
            content: input.prompt
          }
        ]
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      return text || "I could not produce a text response.";
    }
  };
}
