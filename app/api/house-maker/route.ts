import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const CUISINES = ["Indian", "Chinese"] as const;
const DIETS = ["veg", "non-veg"] as const;

type Cuisine = (typeof CUISINES)[number];
type Dietary = (typeof DIETS)[number];

const extractionSchema = z.object({
  ingredients: z.array(z.string()),
  cuisine: z.enum(CUISINES).nullable(),
  dietary: z.enum(DIETS).nullable(),
});

const dishSchema = z.object({
  dishes: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        usesFromFridge: z.array(z.string()),
        missingIngredients: z.array(z.string()),
        steps: z.array(z.string()),
        estimatedMinutes: z.number(),
      })
    )
    .length(3),
});

function mealContext(localHour: number | undefined): string {
  if (typeof localHour !== "number" || Number.isNaN(localHour)) {
    return "any time of day";
  }
  if (localHour < 10) return "breakfast";
  if (localHour < 15) return "lunch";
  if (localHour < 18) return "an afternoon snack";
  return "dinner";
}

async function suggestDishes(
  ingredients: string[],
  cuisine: Cuisine,
  dietary: Dietary,
  localHour: number | undefined
) {
  const meal = mealContext(localHour);
  const { object } = await generateObject({
    model: "anthropic/claude-sonnet-5",
    schema: dishSchema,
    prompt: `You are House Maker, a cooking agent for someone who cooks every day and wants a fast decision, not a browsing session.

He has these ingredients: ${ingredients.join(", ")}.
Cuisine: ${cuisine}. Diet: ${dietary}. It is currently around ${meal} time.

Suggest exactly 3 ${cuisine} ${dietary} dishes he could make, favoring ones that fit ${meal} and use mostly what he already has. For each dish list which of his ingredients it uses, and which additional ingredients are missing. Steps must be clear and beginner-safe (4-8 steps) since he could be cooking at any skill level.`,
  });
  return object;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    message?: string;
    ingredients?: string[];
    cuisine?: Cuisine;
    dietary?: Dietary;
    localHour?: number;
  };

  // Turn 2: slots already filled in (clarify answers picked) — go straight to suggestions.
  if (body.ingredients && body.cuisine && body.dietary) {
    if (!CUISINES.includes(body.cuisine) || !DIETS.includes(body.dietary)) {
      return NextResponse.json({ error: "Invalid cuisine or diet." }, { status: 400 });
    }
    try {
      const result = await suggestDishes(
        body.ingredients,
        body.cuisine,
        body.dietary,
        body.localHour
      );
      return NextResponse.json({ type: "result", ...result });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Couldn't come up with dishes. Please try again." },
        { status: 500 }
      );
    }
  }

  // Turn 1: freeform message — extract ingredients/cuisine/diet.
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Tell me what's in your kitchen." }, { status: 400 });
  }

  try {
    const { object: extracted } = await generateObject({
      model: "anthropic/claude-sonnet-5",
      schema: extractionSchema,
      prompt: `Extract structured info from this message someone sent to a cooking agent: "${message}"

- ingredients: every food item/ingredient he says he has.
- cuisine: "Indian" or "Chinese" only if he clearly said one of those, otherwise null.
- dietary: "veg" or "non-veg" only if he clearly said one of those, otherwise null.`,
    });

    if (extracted.ingredients.length === 0) {
      return NextResponse.json({ type: "needs_ingredients" });
    }

    if (!extracted.cuisine || !extracted.dietary) {
      const missing: ("cuisine" | "dietary")[] = [];
      if (!extracted.cuisine) missing.push("cuisine");
      if (!extracted.dietary) missing.push("dietary");
      return NextResponse.json({
        type: "clarify",
        missing,
        ingredients: extracted.ingredients,
        cuisine: extracted.cuisine,
        dietary: extracted.dietary,
      });
    }

    const result = await suggestDishes(
      extracted.ingredients,
      extracted.cuisine,
      extracted.dietary,
      body.localHour
    );
    return NextResponse.json({ type: "result", ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
