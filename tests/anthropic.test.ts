import { describe, expect, it } from "vitest";
import { SKILL_SELECTION_SYSTEM_PROMPT } from "../src/anthropic.js";

describe("skill selection prompt", () => {
  it("distinguishes project onboarding from general technology learning without hardcoding a skill name", () => {
    expect(SKILL_SELECTION_SYSTEM_PROMPT).toContain("If the latest request is about being new to the current project");
    expect(SKILL_SELECTION_SYSTEM_PROMPT).toContain("greeting or welcoming new users");
    expect(SKILL_SELECTION_SYSTEM_PROMPT).toContain("Do not choose a project-onboarding skill for general learning requests");
    expect(SKILL_SELECTION_SYSTEM_PROMPT).toContain("React");
    expect(SKILL_SELECTION_SYSTEM_PROMPT).not.toContain("choose welcome-me");
  });
});
