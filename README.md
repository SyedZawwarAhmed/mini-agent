# Command Code Mini Agent

A small TypeScript CLI coding agent with local `SKILL.md`-based skill activation.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

On Windows PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="your_key_here"
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
npm run dev -- --print "Review this JavaScript function for readability and bugs."
```

The interactive UI shows which skill matched on each turn, or `none` when nothing matched.

## Bundled Skills

This repo includes bundled skills under `.skills/`:

- `welcome-me`
- `api-and-interface-design`
- `code-review-and-quality`

## Demo Instructions

Run the CLI with one of these prompts:

```bash
npm run dev -- "I'm new to this project, what should I do?"
npm run dev -- --print "Review this JavaScript function for readability and bugs."
npm run dev -- --print "What's the weather in Karachi?"
```

