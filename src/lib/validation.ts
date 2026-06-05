import { z } from "zod";

// ── UUID helpers ──────────────────────────────────────────────────────────────

/**
 * UUID v4 string validation.
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

// ── URL helpers ────────────────────────────────────────────────────────────────

/**
 * A non-empty trimmed URL string with optional scheme.
 */
export const urlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .refine(
    (val) => {
      try {
        new URL(val.startsWith("http") ? val : `https://${val}`);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid URL format" },
  );

// ── City / Search helpers ─────────────────────────────────────────────────────

/**
 * City search query — at least 2 characters, up to 100.
 */
export const citySearchSchema = z
  .string()
  .trim()
  .min(2, "Search query must be at least 2 characters")
  .max(100, "Search query too long");

/**
 * Business type string — non-empty, trimmed.
 */
export const businessTypeSchema = z
  .string()
  .trim()
  .min(1, "Business type is required");

/**
 * City name string — non-empty, trimmed.
 */
export const cityNameSchema = z
  .string()
  .trim()
  .min(1, "City is required");

// ── Pagination helpers ────────────────────────────────────────────────────────

/**
 * Pagination params: page (≥1, default 1), limit (1-100, default 20).
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Pipeline status enum ──────────────────────────────────────────────────────

export const pipelineStatusSchema = z.enum([
  "new_lead",
  "analysed",
  "pitch_generated",
  "contacted",
  "in_conversation",
  "won",
  "lost",
]);

// ── Data clear scope enum ──────────────────────────────────────────────────────

export const dataClearScopeSchema = z.enum([
  "leads",
  "pipeline",
  "pitches",
  "saved_searches",
]);

// ── Common request body schemas ────────────────────────────────────────────────

/**
 * Discover search request body.
 */
export const discoverSchema = z.object({
  city: cityNameSchema,
  businessType: businessTypeSchema,
  radiusMeters: z.coerce.number().int().min(100).max(50000).optional(),
});

/**
 * Generic business ID + website body (used by audit, analyze-design, pipeline POST).
 */
export const businessWebsiteSchema = z.object({
  businessId: uuidSchema.optional(),
  website: urlSchema,
  force: z.boolean().optional().default(false),
});

/**
 * Business ID only (used by checkout, share, refresh-ratings, pipeline PATCH/DELETE).
 */
export const businessIdOnlySchema = z.object({
  businessId: uuidSchema,
});

/**
 * Saved search creation body.
 */
export const savedSearchSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  city: cityNameSchema,
  businessType: businessTypeSchema,
});

/**
 * Product checkout body.
 */
export const checkoutSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

/**
 * Data clear body.
 */
export const dataClearSchema = z.object({
  scope: dataClearScopeSchema,
});

/**
 * Pipeline PATCH body (status update).
 */
export const pipelinePatchSchema = z.object({
  businessId: uuidSchema.optional(),
  status: pipelineStatusSchema,
  pipelineId: z.string().uuid().optional(),
});

/**
 * Pipeline DELETE body.
 */
export const pipelineDeleteSchema = z.object({
  businessId: uuidSchema.optional(),
  pipelineId: z.string().uuid().optional(),
}).refine(
  (data) => data.businessId || data.pipelineId,
  { message: "Must provide businessId or pipelineId" },
);

/**
 * Pitch generation request body.
 */
export const pitchSchema = z.object({
  businessId: uuidSchema.optional(),
  website: urlSchema.optional(),
  audit: z
    .object({
      mobile: z
        .object({
          performance_score: z.number().nullable().optional(),
          seo_score: z.number().nullable().optional(),
          fcp: z.string().nullable().optional(),
          lcp: z.string().nullable().optional(),
          tbt: z.string().nullable().optional(),
          cls: z.string().nullable().optional(),
          status: z.enum(["ok", "timeout", "error"]).optional(),
        })
        .optional(),
      desktop: z
        .object({
          performance_score: z.number().nullable().optional(),
          seo_score: z.number().nullable().optional(),
          fcp: z.string().nullable().optional(),
          lcp: z.string().nullable().optional(),
          tbt: z.string().nullable().optional(),
          cls: z.string().nullable().optional(),
          status: z.enum(["ok", "timeout", "error"]).optional(),
        })
        .optional(),
    })
    .optional(),
  design: z
    .object({
      mobile: z
        .object({
          design_score: z.number().nullable().optional(),
          issues: z
            .array(
              z.object({
                title: z.string(),
                detail: z.string(),
                point_deduction: z.number().optional(),
                impact: z.string().optional(),
              }),
            )
            .nullable()
            .optional(),
        })
        .optional(),
      desktop: z
        .object({
          design_score: z.number().nullable().optional(),
          issues: z
            .array(
              z.object({
                title: z.string(),
                detail: z.string(),
                point_deduction: z.number().optional(),
                impact: z.string().optional(),
              }),
            )
            .nullable()
            .optional(),
        })
        .optional(),
    })
    .optional(),
  tone: z.enum(["professional", "friendly", "luxury"]).optional(),
  length: z.enum(["short", "medium", "detailed"]).optional(),
  channel: z.enum(["email", "whatsapp"]).optional(),
  workflow: z.enum(["website", "social_only", "no_digital_presence"]).optional(),
  socialPlatforms: z.array(z.string()).optional(),
  focus: z.string().optional(),
  opening: z.enum(["direct", "question", "empathy", "data"]).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  force: z.boolean().optional().default(false),
});

/**
 * Pipeline POST body (add to pipeline).
 */
export const pipelinePostSchema = z.object({
  businessId: uuidSchema.optional(),
  website: urlSchema.optional(),
  audit: z
    .object({
      mobile: z.object({ performance_score: z.number().optional() }).optional(),
      desktop: z.object({ performance_score: z.number().optional() }).optional(),
    })
    .optional(),
  design: z
    .object({
      mobile: z.object({ design_score: z.number().optional() }).optional(),
      desktop: z.object({ design_score: z.number().optional() }).optional(),
    })
    .optional(),
}).refine(
  (data) => data.businessId || data.website,
  { message: "Must provide businessId or website" },
);

/**
 * Business ID query param schema (for GET routes).
 */
export const businessIdQuerySchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
});

/**
 * City search query param schema.
 */
export const citySearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  limit: z.string().optional(),
});

/**
 * Contact info schema — validates scraped email/phone data before storage.
 */
export const contactInfoSchema = z.object({
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  scraped_at: z.string().datetime("Invalid ISO date").nullable().optional(),
});
