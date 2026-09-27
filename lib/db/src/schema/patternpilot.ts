import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("learner"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const questionsTable = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionType: text("question_type").notNull().default("complete_the_words"),
  title: text("title").notNull(),
  passage: text("passage").notNull(),
  topic: text("topic").notNull(),
  subtopic: text("subtopic"),
  difficulty: text("difficulty").notNull(),
  sourceLabel: text("source_label"),
  sourceDate: text("source_date"),
  sourceSet: text("source_set"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const questionBlanksTable = pgTable("question_blanks", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questionsTable.id),
  position: integer("position").notNull(),
  prefix: text("prefix").notNull(),
  missingLength: integer("missing_length").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  fullWord: text("full_word").notNull(),
  lemma: text("lemma"),
  partOfSpeech: text("part_of_speech"),
  wordFamily: text("word_family"),
  root: text("root"),
  linguisticPrefix: text("linguistic_prefix"),
  suffix: text("suffix"),
  errorCategory: text("error_category"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
});

export const practiceSessionsTable = pgTable("practice_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  questionCount: integer("question_count").notNull().default(0),
  accuracy: real("accuracy"),
});

export const attemptsTable = pgTable("attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  sessionId: uuid("session_id").references(() => practiceSessionsTable.id),
  questionId: uuid("question_id").references(() => questionsTable.id),
  blankId: uuid("blank_id").references(() => questionBlanksTable.id),
  userAnswer: text("user_answer").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weaknessProfilesTable = pgTable("weakness_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  weaknessType: text("weakness_type").notNull(),
  weaknessKey: text("weakness_key").notNull(),
  mistakeCount: integer("mistake_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  masteryScore: real("mastery_score").notNull().default(0),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weaknessCategoriesTable = pgTable("weakness_categories", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  learningTitle: text("learning_title").notNull(),
  learningDescription: text("learning_description").notNull(),
  objective: text("objective").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const targetedDrillsTable = pgTable("targeted_drills", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryKey: text("category_key").notNull().references(() => weaknessCategoriesTable.key),
  position: integer("position").notNull(),
  prompt: text("prompt").notNull(),
  prefix: text("prefix").notNull(),
  answer: text("answer").notNull(),
  hint: text("hint").notNull(),
});

export const reviewItemsTable = pgTable("review_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  questionId: uuid("question_id").notNull().references(() => questionsTable.id),
  blankId: uuid("blank_id").notNull().references(() => questionBlanksTable.id),
  status: text("status").notNull().default("waiting"),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  provider: text("provider").notNull().default("mock"),
  status: text("status").notNull().default("inactive"),
  plan: text("plan").notNull().default("free"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;