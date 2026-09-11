# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this repo is

"House Maker" — an agent that turns whatever ingredients someone has into a
short, doable shortlist of dishes. The full spec (persona, exact
conversational rules, constraints) lives in [BRIEF.md](BRIEF.md) — read that
first, it's the source of truth for behavior.

**Current delivery mode: conversational, not a web app.** The agent runs
directly in a Claude Code chat — the user states their ingredients (and
optionally cuisine/veg-nonveg) in a message, Claude asks only for whatever
preference is still missing, then hands back a `.docx` file with the top 3
dishes. There is no UI to run or deploy for this flow.

Generate the doc with the `docx` skill: write a small `docx` (npm) script
per dish (name, description, `usesFromFridge`, `missingIngredients`, numbered
steps, estimated time), following [BRIEF.md](BRIEF.md)'s constraints —
cuisine limited to Indian/Chinese, no cooking-skill question, no YouTube
links, exactly 3 dishes. A working example script is at
`output/generate.js` (gitignored `output/` dir — regenerate per request
rather than reusing stale output).

## Legacy Next.js app (deprecated, not in active use)

`app/` still contains an earlier Next.js implementation of the same agent
as a web form/chat UI, calling `POST /api/house-maker`
([app/api/house-maker/route.ts](app/api/house-maker/route.ts)) via
`generateObject` (Vercel AI SDK, `anthropic/claude-sonnet-5`, routed through
AI Gateway). It's kept in the repo but superseded by the conversational
flow above — don't extend it without confirming the user wants the web app
back.

```bash
npm run dev      # start dev server (localhost:3000) — legacy app only
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

No test suite is configured.
