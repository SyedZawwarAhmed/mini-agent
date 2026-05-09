# Mini Agent

A small TypeScript CLI coding agent with local `SKILL.md` skills, an Ink-based interactive UI, and Anthropic-powered responses.

## What It Does

- Discovers bundled skills from repo-root `.skills/`
- Uses the model to choose the best matching skill for each turn
- Loads full skill instructions the first time a skill is used in a session
- Keeps loaded skill instructions in hidden session context for later turns
- Supports both interactive chat and one-shot print mode

Current bundled skills:
- `welcome-me`
- `brainstorming`
- `receiving-code-review`

## Setup

Install dependencies:

```bash
npm install
```

Set your Anthropic API key in either your shell environment or a repo-root `.env` file:

Example `.env`:

```env
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5
```

```bash
export ANTHROPIC_API_KEY=your_key_here
```

On Windows PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="your_key_here"
```

Optional model override:

```bash
export ANTHROPIC_MODEL=claude-sonnet-4-5
```

## Run

Interactive mode:

```bash
npm run dev
```

Interactive mode with an initial prompt:

```bash
npm run dev -- "I'm new to this project, what should I do?"
```

Single-shot print mode:

```bash
npm run dev -- --print "Can you review this code?"
```

## UI Notes

- The interactive UI shows the app name, model, and current working directory.
- When a skill is used, the transcript shows an inline badge like `[skill used] welcome-me`.
- If no skill is used, no skill badge is shown.
- The `welcome-me` header is rendered prominently rather than dimmed.

## Skills

Bundled skills live under `.skills/`:

- `.skills/welcome-me/SKILL.md`
- `.skills/brainstorming/SKILL.md`
- `.skills/receiving-code-review/SKILL.md`

### `welcome-me`

Used for onboarding-style prompts such as:
- "I'm new to this project, what should I do?"
- "I am new to this codebase"
- "just joined the team, where do I start"

When selected, it must include this exact line:

> Welcome to our Command Code assignment agent!

### `brainstorming`

Used for idea generation, product thinking, and open-ended exploration prompts.

### `receiving-code-review`

Used for code review, feedback, correctness, maintainability, and quality-focused prompts.

## How Skill Selection Works

Skill selection is LLM-driven.

For each turn, the app sends:
- the latest user request
- prior visible chat history
- available skill names and descriptions

The model chooses one skill name or `none`.

If a skill is selected:
- its full `SKILL.md` is loaded into hidden system context the first time it is used
- it remains available for later turns in the same session
- hard requirements from that skill should still be followed on later turns

## Development

Typecheck:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Tests:

```bash
npm run test
```

## Submission Notes

### Time Spent

It took me around 4-5 hours to plan, build and test this project.

### Challenges

- Getting skill selection and session behavior aligned with the intended UX without overbuilding a full agent runtime
- Preserving prior skill usage in hidden context so the model can answer questions about earlier turns

### Demo Instructions

Run command:

```bash
npm run dev
```

Example prompts:

```bash
I'm new to this project, what should I do?
Can you review this function for readability and bugs?
Help me brainstorm a clean API for a note-taking app.
```
