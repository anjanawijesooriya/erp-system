CREATE TABLE "document_branding" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#4f46e5' NOT NULL,
	"company_address" text,
	"company_phone" text,
	"company_email" text,
	"footer_note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_branding" ADD CONSTRAINT "document_branding_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;