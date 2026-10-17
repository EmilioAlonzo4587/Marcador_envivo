CREATE TYPE "public"."player_position" AS ENUM('goalkeeper', 'defender', 'midfielder', 'forward');--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"name" text NOT NULL,
	"shirt_number" integer,
	"position" "player_position",
	CONSTRAINT "players_team_name_unique" UNIQUE("team","name")
);
--> statement-breakpoint
CREATE INDEX "players_team_idx" ON "players" USING btree ("team");