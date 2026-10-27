import { z } from 'zod'

/**
 * Engine Result 3.0 contract (`aiva.system_a.result/3.0`).
 *
 * Accepts `versions.schema` "3.0" and "3.1". 3.1 (engine v5.7) is additive: evidence rows gain
 * `kind` / `field_name` / `line_no`, `bbox_missing_reason.reason` is a fixed enum, and review rows
 * (`kind: 'review'`) carry `exception_code: null` + `severity: null`. The contract id is unchanged.
 *
 * Ported from `temp/schemas/result-3.0.schema.json`. The Portal treats this as
 * the Engine's outward-facing contract: Portal code must never depend on Engine
 * internals, so the blob sections (`extraction`, `normalized_fields`,
 * `oracle_snapshot`, `line_matching`, `metrics`) are validated as "present but
 * open" objects — exactly as the JSON Schema declares them.
 */

/** `[x, y, w, h]` normalized 0..1, top-left origin (see `package.coordinate_system`). */
export const normalizedBBoxSchema = z.array(z.number().min(0).max(1)).length(4)

const normalizedBBoxOrNull = normalizedBBoxSchema.nullable()

const exceptionCodeSchema = z.string().regex(/^E(0[1-9]|1[0-5])$/, {
  message: 'exception_code must match ^E(0[1-9]|1[0-5])$ (Standard exception codes E01-E15)',
})

const ruleIdSchema = z.enum([
  'V-01', 'V-02', 'V-03', 'V-04', 'V-05', 'V-06', 'V-07', 'V-08', 'V-09',
])

const ruleResultSchema = z.enum(['pass', 'fail', 'not_evaluated', 'manual_review'])

const severitySchema = z.enum(['Low', 'Medium', 'High'])

/** Engine internals the Portal stores verbatim but never reads field-by-field. */
const openObject = z.record(z.string(), z.unknown())

const coordinateSystemSchema = z.object({
  origin: z.string(),
  unit: z.string(),
  range: z.array(z.number()).length(2),
  bbox_format: z.string(),
  reference: z.string().optional(),
})

const sourceReferenceSchema = z
  .object({
    package_id: z.string(),
    dms_doc_id: z.string(),
    file_sha256: z.string(),
    extractors: z.record(z.string(), z.string()).optional(),
  })
  .passthrough()

export const engineOcrElementSchema = z.object({
  element_id: z.string(),
  document_id: z.string(),
  document_type: z.string(),
  page_no: z.number().int().nullable(),
  element_type: z.enum([
    'page', 'section', 'table', 'row', 'cell', 'field', 'word', 'signature', 'stamp',
  ]),
  parent_id: z.string().nullable().optional(),
  field_name: z.string().nullable(),
  raw_value: z.string().nullable(),
  normalized_value: z.union([z.string(), z.number(), z.boolean()]).nullable(),
  confidence: z.number().nullable(),
  bbox: normalizedBBoxOrNull,
  source_reference: sourceReferenceSchema,
})

export const engineRuleResultSchema = z.object({
  rule_id: ruleIdSchema,
  rule_version: z.string(),
  result: ruleResultSchema,
  detail: z.string().nullable().optional(),
  // Contract-required (may be null) — presence is enforced on purpose.
  halted_by: z.string().nullable(),
  evidence_ids: z.array(z.string()),
  data: z.unknown().optional(),
})

export const engineEvidenceSchema = z.object({
  evidence_id: z.string().optional(),
  rule_id: ruleIdSchema,
  rule_version: z.string(),
  result: ruleResultSchema,
  exception_code: exceptionCodeSchema.nullable(),
  severity: severitySchema.nullable(),
  actual_value: z.union([z.string(), z.number()]).nullable(),
  expected_value: z.union([z.string(), z.number()]).nullable(),
  source_document: z.object({ document_id: z.string(), source: z.string().nullable() }),
  page_no: z.array(z.number().int()),
  related_element_ids: z.array(z.string()),
  related_oracle_refs: z.array(z.string()).optional(),
  // A missing bbox is expressed as an empty `bboxes` array, never a null entry,
  // so downstream PDF/overlay code can dereference `bbox` safely.
  bboxes: z.array(
    z.object({ element_id: z.string(), page_no: z.number().int(), bbox: normalizedBBoxSchema }),
  ),
  // Schema 3.1 (engine v5.7): `{ element_ids, reason, details? }`. Any other shape from an older
  // engine degrades to null rather than rejecting the whole payload; the adapter then reports UNKNOWN.
  bbox_missing_reason: z
    .object({
      element_ids: z.array(z.string()),
      reason: z.string(),
      details: z.record(z.string(), z.string()).optional(),
    })
    .nullable()
    .optional()
    .catch(null),
  halted_by: z.string().nullable(),
  evaluated_at: z.string(),
  message_th: z.string().optional(),
  // Schema 3.1 additive display fields. `kind: 'review'` = manual_review evidence with no exception
  // code (never in `exceptions[]`). Absent on 3.0 payloads.
  kind: z.enum(['exception', 'review']).optional().catch(undefined),
  field_name: z.string().nullable().optional(),
  line_no: z.number().int().nullable().optional(),
})

export const engineExceptionSchema = z.object({
  exception_id: z.string(),
  code: exceptionCodeSchema,
  name: z.string(),
  severity: severitySchema,
  rule_id: ruleIdSchema,
  evidence_ids: z.array(z.string()),
})

export const engineRecommendationSchema = z.object({
  value: z.enum(['AUTO_PASS', 'REVIEW', 'HOLD', 'MANUAL_REVIEW', 'SYSTEM_ERROR']),
  max_severity: z.enum(['Low', 'Medium', 'High', 'None']),
  exception_codes: z.array(exceptionCodeSchema),
  reasons: z.array(z.string()).optional(),
  halted_by: z.string().nullable().optional(),
})

export const engineRequestSchema = z.object({
  validation_id: z.string(),
  correlation_id: z.string().nullable(),
  validation_round: z.number().int().nonnegative(),
  document_revision: z.number().int().nonnegative(),
  completed_at: z.string(),
  idempotency_key: z.string().nullable().optional(),
  source: z.string().optional(),
  run_id: z.string().optional(),
  dms_doc_id: z.string().optional(),
  content_kind: z.string().optional(),
  declared_mime: z.string().nullable().optional(),
})

export const enginePageSchema = z.object({
  page_no: z.number().int().positive(),
  width_pt: z.number().positive(),
  height_pt: z.number().positive(),
  rotation: z.number(),
  render_dpi: z.number().optional(),
  page_type: z.string(),
  type_confidence: z.number().nullable().optional(),
  ocr_quality: z.number().nullable().optional(),
})

export const engineDocumentSchema = z.object({
  document_id: z.string(),
  document_type: z.string(),
  pages: z.array(z.number().int()),
  confidence: z.number().nullable().optional(),
})

/**
 * Optional `identity` block (Portal standard `identity.*`, see temp/schemas/web_schema.json).
 *
 * Deliberately lenient here: the cross-field rules (RESOLVED needs receive_id, NOT_FOUND needs
 * receive_id = null, UNRESOLVED needs missing_keys) live in `src/server/businessKey.ts` so that a
 * violation is reported as one readable 422 instead of a zod union error. Engines that do not send
 * the block yet (v6.6 corpus) keep working: the Portal derives the identity from `oracle_snapshot`.
 */
export const engineIdentitySchema = z.object({
  status: z.enum(['RESOLVED', 'NOT_FOUND', 'UNRESOLVED']),
  reason: z.enum(['FOUND', 'RECEIPT_NOT_FOUND', 'HALTED_BEFORE_LOOKUP', 'KEYS_UNREADABLE']).optional(),
  receive_id: z.string().nullable().optional(),
  lookup_path: z.string().nullable().optional(),
  missing_keys: z.array(z.string()).optional(),
})

/**
 * Portal-owned workflow fields that MUST NOT appear in an Engine payload
 * (`not.anyOf` in the JSON Schema). This is the decoupling guard: the Engine
 * reports findings, the Portal owns workflow state.
 *
 * NOTE: the top-level schema must be a `looseObject`, not a plain `object`.
 * A plain `z.object()` strips unknown keys *before* `superRefine` runs, which
 * would silently make this guard a no-op for exactly these unknown keys.
 */
const FORBIDDEN_ENGINE_KEYS = [
  'workflow', 'allowed_actions', 'assigned_to', 'approved', 'ap_status', 'duplicate_status', 'history',
] as const

export const engineResultV3Schema = z
  .looseObject({
    contract: z.literal('aiva.system_a.result/3.0'),
    request: engineRequestSchema,
    versions: z.object({
      schema: z.string(), // "3.0" | "3.1" (additive) — not pinned on purpose
      standard: z.string(),
      ruleset: z.string(),
      models: z.record(z.string(), z.string()),
      prompts: z.record(z.string(), z.string()),
    }),
    package: z.object({
      package_id: z.string(),
      dms_doc_id: z.string(),
      file_sha256: z.string(),
      page_count: z.number().int().nonnegative(),
      pages_complete: z.boolean().optional(),
      coordinate_system: coordinateSystemSchema,
    }),
    // Optional: see engineIdentitySchema. Absent = derived from oracle_snapshot by the Portal.
    identity: engineIdentitySchema.optional(),
    pages: z.array(enginePageSchema),
    documents: z.array(engineDocumentSchema),
    ocr: z.object({ elements: z.array(engineOcrElementSchema) }),
    extraction: openObject.nullable().optional(),
    normalized_fields: openObject.nullable().optional(),
    oracle_snapshot: openObject.nullable().optional(),
    line_matching: openObject.nullable().optional(),
    rule_results: z.array(engineRuleResultSchema).length(9),
    evidence: z.array(engineEvidenceSchema),
    exceptions: z.array(engineExceptionSchema),
    recommendation: engineRecommendationSchema,
    system_errors: z.array(z.unknown()).optional(),
    metrics: openObject,
    integrity: z.object({
      payload_sha256: z.string(),
      excludes: z.array(z.string()).optional(),
    }),
    // Convenience projection emitted by the Engine; not part of the required contract.
    summary: openObject.optional(),
  })
  .superRefine((payload, ctx) => {
    for (const key of FORBIDDEN_ENGINE_KEYS) {
      if (key in (payload as Record<string, unknown>)) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `Engine payload must not carry Portal-owned workflow field "${key}" (contract aiva.system_a.result/3.0 forbids it)`,
        })
      }
    }
  })

export type NormalizedBBox = readonly [number, number, number, number]
export type EngineOcrElement = z.infer<typeof engineOcrElementSchema>
export type EngineRuleResult = z.infer<typeof engineRuleResultSchema>
export type EngineEvidence = z.infer<typeof engineEvidenceSchema>
export type EngineException = z.infer<typeof engineExceptionSchema>
export type EngineRecommendation = z.infer<typeof engineRecommendationSchema>
export type EngineIdentity = z.infer<typeof engineIdentitySchema>
export type EngineRequest = z.infer<typeof engineRequestSchema>
export type EnginePage = z.infer<typeof enginePageSchema>
export type EngineDocument = z.infer<typeof engineDocumentSchema>
export type EngineResultV3 = z.infer<typeof engineResultV3Schema>
