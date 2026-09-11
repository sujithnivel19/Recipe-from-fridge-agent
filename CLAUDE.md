# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

No test suite is configured yet.

## Architecture

This is "House Maker" — a single-agent Next.js (App Router) app that suggests recipes from ingredients the user already has. See [BRIEF.md](BRIEF.md) for the full product spec (persona, exact conversational rules, constraints).

**Flow is a two-turn API, driven entirely from `app/page.tsx`:**

1. `POST /api/house-maker` ([app/api/house-maker/route.ts](app/api/house-maker/route.ts)) is called first with just `{ message, localHour }` — a freeform string like "I have chicken, rice, onions — want something Indian non-veg".
2. The route uses `generateObject` (Vercel AI SDK, model `anthropic/claude-sonnet-5`) against `extractionSchema` to pull out `ingredients`, `cuisine` (`Indian | Chinese` only), and `dietary` (`veg | non-veg` only).
3. Response is one of three shapes, discriminated by `type`:
   - `needs_ingredients` — no ingredients found; client asks the user to list them.
   - `clarify` — cuisine and/or dietary wasn't stated; client renders fixed-choice buttons (never free text) for whichever is missing.
   - `result` — both known; server has already called `suggestDishes` and returns `dishes` (always exactly 3, enforced by `dishSchema`'s `.length(3)`).
4. If the client got `clarify`, it re-POSTs the same endpoint with `{ ingredients, cuisine, dietary, localHour }` filled in (`app/page.tsx`'s `pickAnswer`) — this second-turn payload shape is what the route's early branch (`if (body.ingredients && body.cuisine && body.dietary)`) detects to skip straight to `suggestDishes`.

**Time-of-day bias:** `localHour` (from `new Date().getHours()` on the client) maps to a meal context (`mealContext()` in the route: breakfast/lunch/afternoon snack/dinner) that's folded into the suggestion prompt. It only biases dish selection — it never substitutes for the cuisine/dietary questions.

**Hard constraints baked into the schema/prompt, not just the UI:** cuisine limited to Indian or Chinese, no cooking-skill question ever, exactly 3 dishes, each with `usesFromFridge`, `missingIngredients`, a 4-8 step beginner-safe `steps` array, and `estimatedMinutes`.

All state (`clarify`, `dishes`, `needsIngredients`, `error`) lives in `app/page.tsx` component state — there's no separate store or session persistence across page loads.
