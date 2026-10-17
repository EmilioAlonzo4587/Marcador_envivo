ALTER TYPE "public"."event_type" ADD VALUE 'yellow_card';--> statement-breakpoint
ALTER TYPE "public"."event_type" ADD VALUE 'red_card';--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "player_in" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "venue" text;--> statement-breakpoint
CREATE INDEX "match_events_timeline_idx" ON "match_events" USING btree ("match_id","minute","created_at");