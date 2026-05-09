# Mini Agent

## Project Goal

Build a small TypeScript Node CLI coding agent that implements the open Agent Skills `SKILL.md` format.

The CLI should:
- use Anthropic's API through an env-provided API key
- support both interactive and non-interactive usage
- discover and activate skills based on the user's prompt
- load full skill instructions only after a skill is selected
- include exactly three local skills:
  - `welcome-me`
  - `brainstorming`
  - `receiving-code-review`

## Project Root

This repository itself is the agent project root.

Bundled skills live in the repo-root `.skills/` directory.

The canonical required path is:
- `.skills/welcome-me/SKILL.md`

The default skill lookup is for this repo's bundled skills, not an external target codebase.

## CLI Behavior

Support these flows:

- `npm run dev`
  Start the Ink interactive session.

- `npm run dev -- "prompt"`
  Start interactive mode with an initial prompt.

- `npm run dev -- --print "prompt"`
  Run once, print the answer, and exit.

Keep the interface minimal and terminal-focused.

## UI Expectations

The interactive UI should visibly show which skill was activated for each turn, or `none` when no skill matched.

Per-turn skill display should use these forms:
- `Skill: welcome-me`
- `Skill: brainstorming`
- `Skill: receiving-code-review`
- `Skill: none`

In `--print` mode, prepend a single plain-text metadata line:
- `[skill] welcome-me`
- `[skill] none`

## Model and Environment

Use Anthropic as the provider.

Environment variables:
- `ANTHROPIC_API_KEY` is required
- `ANTHROPIC_MODEL` is optional

Default model:
- `claude-sonnet-4-5`

Keep provider integration isolated from the rest of the CLI.

## Skill Requirements

Implement the open Agent Skills `SKILL.md` format:

- each skill lives in its own folder
- each skill must contain a `SKILL.md`
- parse YAML frontmatter plus markdown body
- validate at minimum:
  - `name` exists
  - `description` exists
  - `name` matches the parent folder
  - `name` uses lowercase letters, numbers, and hyphens

Follow progressive disclosure:
- load only skill metadata at discovery time
- load the full skill body only when the skill is activated

## Skill Discovery

Primary discovery root:
- `.skills/`

Compatibility roots:
- `.commandcode/skills/`
- `.agents/skills/`

Discovery precedence:
1. explicit CLI override if implemented
2. `.skills/`
3. `.commandcode/skills/`
4. `.agents/skills/`

Keep discovery project-local only.

## Skill Matching

Use deterministic skill matching rather than asking the model which skill to use.

Matching order:
1. explicit mention of a skill name
2. onboarding phrase detection for `welcome-me`
3. keyword and phrase scoring against each skill's `name` and `description`

If no skill is relevant, do not load any skill body.

## `welcome-me` Behavior

The `welcome-me` skill must activate for prompts like:
- "I'm new to this project, what should I do"
- "new to this project what should i do"
- "how do I get started here"

When `welcome-me` is activated, the response must include this exact header:

> Welcome to our Command Code assignment agent!

If the user's prompt is unrelated, such as asking about weather, `welcome-me` must not be loaded.
