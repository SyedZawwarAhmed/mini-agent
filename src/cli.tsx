import React from "react";
import { render } from "ink";
import { DEFAULT_MODEL } from "./anthropic.js";
import { ChatApp } from "./components/ChatApp.js";
import { createAgentSession } from "./session.js";

export async function runInteractiveCli(options: {
  initialPrompt?: string;
  model?: string;
  skillsDir?: string;
}): Promise<void> {
  const session = await createAgentSession({
    model: options.model,
    skillsDir: options.skillsDir
  });
  const modelLabel = options.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  render(
    <ChatApp
      session={session}
      initialPrompt={options.initialPrompt}
      modelLabel={modelLabel}
      cwd={process.cwd()}
    />
  );
}
