"use client";

import { useState, FormEvent } from "react";

type Cuisine = "Indian" | "Chinese";
type Dietary = "veg" | "non-veg";

type Dish = {
  name: string;
  description: string;
  usesFromFridge: string[];
  missingIngredients: string[];
  steps: string[];
  estimatedMinutes: number;
};

type ApiResponse =
  | { type: "needs_ingredients" }
  | {
      type: "clarify";
      missing: ("cuisine" | "dietary")[];
      ingredients: string[];
      cuisine: Cuisine | null;
      dietary: Dietary | null;
    }
  | { type: "result"; dishes: Dish[] }
  | { error: string };

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarify, setClarify] = useState<
    Extract<ApiResponse, { type: "clarify" }> | null
  >(null);
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [needsIngredients, setNeedsIngredients] = useState(false);

  const reset = () => {
    setError(null);
    setClarify(null);
    setDishes(null);
    setNeedsIngredients(false);
  };

  const handleResponse = async (res: Response) => {
    const data = (await res.json()) as ApiResponse;
    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "Something went wrong.");
      return;
    }
    if (data.type === "needs_ingredients") {
      setNeedsIngredients(true);
    } else if (data.type === "clarify") {
      setClarify(data);
    } else if (data.type === "result") {
      setDishes(data.dishes);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    reset();
    setLoading(true);
    try {
      const res = await fetch("/api/house-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, localHour: new Date().getHours() }),
      });
      await handleResponse(res);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickAnswer = async (
    field: "cuisine" | "dietary",
    value: Cuisine | Dietary
  ) => {
    if (!clarify) return;
    const cuisine = field === "cuisine" ? (value as Cuisine) : clarify.cuisine;
    const dietary = field === "dietary" ? (value as Dietary) : clarify.dietary;

    if (!cuisine || !dietary) {
      // still missing the other one — just remember this pick
      setClarify({ ...clarify, [field]: value });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/house-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: clarify.ingredients,
          cuisine,
          dietary,
          localHour: new Date().getHours(),
        }),
      });
      setClarify(null);
      await handleResponse(res);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          House Maker
        </h1>
        <p className="text-neutral-500">
          Tell it what&apos;s in your kitchen. It&apos;ll pick the top 3
          dishes you can actually cook right now.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="message-input"
          className="text-sm font-medium text-neutral-600"
        >
          What&apos;s in your kitchen?
        </label>
        <textarea
          id="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. I have chicken, rice, onions, garlic — want something Indian non-veg"
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-300 p-3 outline-none focus-within:border-neutral-500"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask House Maker"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {needsIngredients && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          I couldn&apos;t find any ingredients in that — tell me what you
          have, e.g. &quot;eggs, spinach, rice&quot;.
        </p>
      )}

      {clarify && (
        <div className="space-y-4 rounded-xl border border-neutral-200 p-5">
          {clarify.missing.includes("cuisine") && !clarify.cuisine && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">
                Which cuisine?
              </p>
              <div className="flex gap-2">
                {(["Indian", "Chinese"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => pickAnswer("cuisine", c)}
                    className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm hover:border-neutral-500"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {clarify.missing.includes("dietary") && !clarify.dietary && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">
                Veg or non-veg?
              </p>
              <div className="flex gap-2">
                {(["veg", "non-veg"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => pickAnswer("dietary", d)}
                    className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm capitalize hover:border-neutral-500"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {dishes && (
        <section className="space-y-4">
          {dishes.map((dish) => (
            <article
              key={dish.name}
              className="space-y-3 rounded-xl border border-neutral-200 p-5"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold">{dish.name}</h2>
                <span className="shrink-0 text-xs text-neutral-500">
                  ~{dish.estimatedMinutes} min
                </span>
              </div>
              <p className="text-sm text-neutral-600">{dish.description}</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {dish.usesFromFridge.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-green-50 px-2 py-1 text-green-700"
                  >
                    {i}
                  </span>
                ))}
                {dish.missingIngredients.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-amber-50 px-2 py-1 text-amber-700"
                  >
                    + {i}
                  </span>
                ))}
              </div>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                {dish.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
