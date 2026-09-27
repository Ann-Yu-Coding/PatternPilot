ALTER TABLE "question_blanks" ADD COLUMN "public_id" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "public_id" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "estimated_minutes" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "display_order" integer;--> statement-breakpoint
-- Preserve existing UUID identities as public question IDs. No existing row is deleted.
UPDATE questions SET public_id = id::text;
--> statement-breakpoint
WITH ordered AS (SELECT id, row_number() OVER (ORDER BY created_at, id) AS n FROM questions)
UPDATE questions q SET display_order = ordered.n FROM ordered WHERE q.id = ordered.id;
--> statement-breakpoint
-- Existing blank UUID tokens are preserved. Ambiguous/local-token legacy content
-- must be reconciled explicitly before migration; never guess its answer mapping.
UPDATE question_blanks SET public_id = id::text;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM question_blanks b JOIN questions q ON q.id = b.question_id
    WHERE strpos(q.passage, '{{' || b.public_id || '}}') = 0
  ) THEN
    RAISE EXCEPTION 'Existing question tokens do not match blank UUIDs; reconcile legacy content before migrating';
  END IF;
  IF EXISTS (
    SELECT 1 FROM questions q,
      LATERAL regexp_matches(q.passage, '\{\{([^{}]+)\}\}', 'g') AS token(parts)
    WHERE NOT EXISTS (SELECT 1 FROM question_blanks b WHERE b.question_id = q.id AND b.public_id = token.parts[1])
  ) OR EXISTS (
    SELECT 1 FROM questions q JOIN question_blanks b ON b.question_id = q.id
    WHERE (length(q.passage) - length(replace(q.passage, '{{' || b.public_id || '}}', '')))
      / length('{{' || b.public_id || '}}') <> 1
  ) THEN
    RAISE EXCEPTION 'Existing questions have unknown or repeated blank tokens; reconcile before migrating';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE questions ALTER COLUMN public_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE questions ALTER COLUMN display_order SET NOT NULL;
--> statement-breakpoint
ALTER TABLE question_blanks ALTER COLUMN public_id SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "question_blanks_question_position_unique" ON "question_blanks" USING btree ("question_id","position");--> statement-breakpoint
CREATE INDEX "questions_published_order_idx" ON "questions" USING btree ("published","display_order","public_id");--> statement-breakpoint
ALTER TABLE "question_blanks" ADD CONSTRAINT "question_blanks_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
ALTER TABLE "question_blanks" ADD CONSTRAINT "question_blanks_position_positive" CHECK ("question_blanks"."position" > 0);--> statement-breakpoint
ALTER TABLE "question_blanks" ADD CONSTRAINT "question_blanks_length_positive" CHECK ("question_blanks"."missing_length" > 0);--> statement-breakpoint
ALTER TABLE "question_blanks" ADD CONSTRAINT "question_blanks_answer_length" CHECK (char_length("question_blanks"."correct_answer") = "question_blanks"."missing_length");--> statement-breakpoint
ALTER TABLE "question_blanks" ADD CONSTRAINT "question_blanks_full_word" CHECK ("question_blanks"."full_word" = "question_blanks"."prefix" || "question_blanks"."correct_answer");--> statement-breakpoint
ALTER TABLE "question_blanks" ADD CONSTRAINT "question_blanks_tags_array" CHECK (jsonb_typeof("question_blanks"."tags") = 'array');--> statement-breakpoint
ALTER TABLE "question_blanks" ADD CONSTRAINT "question_blanks_public_id_nonempty" CHECK (length("question_blanks"."public_id") > 0);--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_estimated_minutes_positive" CHECK ("questions"."estimated_minutes" > 0);--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_display_order_positive" CHECK ("questions"."display_order" > 0);--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_public_id_nonempty" CHECK (length("questions"."public_id") > 0);