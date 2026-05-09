#!/usr/bin/env node

import "dotenv/config";
import { Command } from "commander";
import { runInteractiveCli } from "./cli.js";
import { runPrintMode } from "./session.js";

const program = new Command();

program
  .name("mini-agent")
  .description("A small TypeScript CLI coding agent with local SKILL.md skills.")
  .argument("[prompt...]", "Optional initial prompt for interactive mode")
  .option("--print", "Run once, print the response, and exit")
  .option("--model <model>", "Override the Anthropic model")
  .option("--skills-dir <path>", "Override the default skills directory")
  .action(async (promptParts: string[], options: { print?: boolean; model?: string; skillsDir?: string }) => {
    const initialPrompt = promptParts.join(" ").trim() || undefined;

    if (options.print) {
      await runPrintMode({
        input: initialPrompt,
        model: options.model,
        skillsDir: options.skillsDir
      });
      return;
    }

    await runInteractiveCli({
      initialPrompt,
      model: options.model,
      skillsDir: options.skillsDir
    });
  });

async function main(): Promise<void> {
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
