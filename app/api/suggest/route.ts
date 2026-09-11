import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const recipeSchema = z.object({
  recipes: z
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
    .min(1)
    .max(5),
  shoppingList: z.array(
    z.object({
      item: z.string(),
      neededFor: z.array(z.string()),
    })
  ),
});

export async function POST(req: Request) {
  const { ingredients } = (await req.json()) as { ingredients: string[] };

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one ingredient." },
      { status: 400 }
    );
  }

  try {
    const { object } = await generateObject({
      model: "anthropic/claude-sonnet-5",
      schema: recipeSchema,
      prompt: `You are a helpful cooking assistant. The user has these ingredients in their fridge/pantry: ${ingredients.join(
        ", "
      )}.

Suggest 3-5 recipes they could make. Prefer recipes that use mostly what they already have. For each recipe list which of their ingredients it uses, and which additional ingredients are missing. Then produce a consolidated shopping list of all missing ingredients across the recipes, noting which recipe(s) need each item. Keep steps concise (4-8 steps per recipe).`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Couldn't generate recipes. Please try again." },
      { status: 500 }
    );
  }
}
