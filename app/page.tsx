"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";

type Recipe = {
  name: string;
  description: string;
  usesFromFridge: string[];
  missingIngredients: string[];
  steps: string[];
  estimatedMinutes: number;
};

type ShoppingItem = {
  item: string;
  neededFor: string[];
};

type SuggestResponse = {
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
};

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addIngredient = () => {
    const value = draft.trim().replace(/,$/, "");
    if (value && !ingredients.includes(value)) {
      setIngredients((prev) => [...prev, value]);
    }
    setDraft("");
  };

  const removeIngredient = (target: string) => {
    setIngredients((prev) => prev.filter((i) => i !== target));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient();
    } else if (e.key === "Backspace" && draft === "" && ingredients.length) {
      setIngredients((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) addIngredient();
    const list = draft.trim()
      ? [...ingredients, draft.trim()]
      : ingredients;
    if (list.length === 0) {
      setError("Add at least one ingredient first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Recipe from Fridge
        </h1>
        <p className="text-neutral-500">
          List what&apos;s in your fridge and pantry. Get recipe ideas, plus
          a shopping list for anything you&apos;re missing.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="ingredient-input"
          className="text-sm font-medium text-neutral-600"
        >
          Ingredients
        </label>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-300 p-3 focus-within:border-neutral-500">
          {ingredients.map((ingredient) => (
            <span
              key={ingredient}
              className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => removeIngredient(ingredient)}
                aria-label={`Remove ${ingredient}`}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="ingredient-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addIngredient}
            placeholder={
              ingredients.length ? "Add another…" : "e.g. eggs, spinach, rice"
            }
            className="min-w-[10ch] flex-1 bg-transparent py-1 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Suggest recipes"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <section className="space-y-8">
          <div className="space-y-4">
            {result.recipes.map((recipe) => (
              <article
                key={recipe.name}
                className="space-y-3 rounded-xl border border-neutral-200 p-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-semibold">{recipe.name}</h2>
                  <span className="shrink-0 text-xs text-neutral-500">
                    ~{recipe.estimatedMinutes} min
                  </span>
                </div>
                <p className="text-sm text-neutral-600">
                  {recipe.description}
                </p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {recipe.usesFromFridge.map((i) => (
                    <span
                      key={i}
                      className="rounded-full bg-green-50 px-2 py-1 text-green-700"
                    >
                      {i}
                    </span>
                  ))}
                  {recipe.missingIngredients.map((i) => (
                    <span
                      key={i}
                      className="rounded-full bg-amber-50 px-2 py-1 text-amber-700"
                    >
                      + {i}
                    </span>
                  ))}
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                  {recipe.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          {result.shoppingList.length > 0 && (
            <div className="rounded-xl border border-neutral-200 p-5">
              <h2 className="mb-3 text-lg font-semibold">Shopping list</h2>
              <ul className="space-y-2 text-sm">
                {result.shoppingList.map((entry) => (
                  <li key={entry.item} className="flex justify-between gap-4">
                    <span>{entry.item}</span>
                    <span className="text-neutral-400">
                      {entry.neededFor.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
