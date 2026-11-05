CREATE TYPE "public"."plan_tier" AS ENUM('pos', 'business', 'erp');--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DATA TYPE plan_tier USING "plan"::plan_tier;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DEFAULT 'pos';