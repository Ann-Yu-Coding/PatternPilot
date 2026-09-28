import { legacyDrillContent } from "./legacy-drill-content";
import { asc, eq } from "drizzle-orm";
import {
  db,
  targetedDrillsTable,
  weaknessCategoriesTable,
} from "@workspace/db";
import {
  getLearningContent,
  learningContentByWeakness,
  type LearningContent,
  type WeaknessKey,
} from "./diagnosis";

let seedPromise: Promise<void> | undefined;

async function seedLearningContent() {
  const categories = Object.values(learningContentByWeakness).map((item) => ({
    key: item.categoryKey,
    label: item.label,
    description: item.detail,
    learningTitle: item.learningTitle,
    learningDescription: item.learningDescription,
    objective: item.objective,
  }));
  await db
    .insert(weaknessCategoriesTable)
    .values(categories)
    .onConflictDoNothing();

  for (const item of Object.values(learningContentByWeakness)) {
    const existing = await db
      .select({ id: targetedDrillsTable.id })
      .from(targetedDrillsTable)
      .where(eq(targetedDrillsTable.categoryKey, item.categoryKey))
      .limit(1);
    if (existing.length) continue;
    await db.insert(targetedDrillsTable).values(
      item.prompts.map((prompt, position) => ({
        categoryKey: item.categoryKey,
        position,
        prompt: prompt.prompt,
        prefix: prompt.prefix,
        answer: prompt.answer,
        hint: prompt.hint,
      })),
    );
  }
}

async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedLearningContent().catch(() => undefined);
  }
  await seedPromise;
}

export async function getStoredLearningContent(
  key: string | undefined,
): Promise<LearningContent> {
  const fallback = getLearningContent(key);
  try {
    await ensureSeeded();
    const storedCategory = await db
      .select()
      .from(weaknessCategoriesTable)
      .where(eq(weaknessCategoriesTable.key, fallback.categoryKey))
      .limit(1);
    const storedDrills = await db
      .select()
      .from(targetedDrillsTable)
      .where(eq(targetedDrillsTable.categoryKey, fallback.categoryKey))
      .orderBy(asc(targetedDrillsTable.position));
    if (!storedCategory[0] || !storedDrills.length) return fallback;
    const builtIn = storedDrills.every((drill) =>
      fallback.prompts.some(
        (p) =>
          p.prefix === drill.prefix &&
          p.answer === drill.answer &&
          ((p.prompt === drill.prompt && p.hint === drill.hint) ||
            legacyDrillContent.some(
              (old) => old.prompt === drill.prompt && old.hint === drill.hint,
            )),
      ),
    );
    // Legacy seeded sets had 3–4 items. Keep their IDs while using the revised five-item editorial catalog.
    const prompts = builtIn
      ? fallback.prompts.map((p) => ({
          ...p,
          id:
            storedDrills.find(
              (d) => d.prefix === p.prefix && d.answer === p.answer,
            )?.id || p.id,
        }))
      : storedDrills
          .slice(0, 5)
          .map((drill) => ({
            id: drill.id,
            prompt: drill.prompt,
            prefix: drill.prefix,
            answer: drill.answer,
            hint: drill.hint,
          }));
    return {
      categoryKey: fallback.categoryKey,
      label: storedCategory[0].label,
      detail: storedCategory[0].description,
      learningTitle: storedCategory[0].learningTitle,
      learningDescription: storedCategory[0].learningDescription,
      objective: storedCategory[0].objective,
      prompts,
    };
  } catch {
    return fallback;
  }
}

export async function getStoredContentForWeaknesses<
  T extends { key: WeaknessKey },
>(weaknesses: T[]) {
  return Promise.all(
    weaknesses.map(async (weakness) => {
      const stored = await getStoredLearningContent(weakness.key);
      return {
        ...weakness,
        learningTitle: stored.learningTitle,
        learningDescription: stored.learningDescription,
        drillCount: stored.prompts.length,
      };
    }),
  );
}
