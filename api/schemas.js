/**
 * api/schemas.js
 * Validation schemas for API endpoints
 */

const skillSchema = {
  type: "array",
  items: { type: "string" },
  minItems: 1,
};

const predictionRequestSchema = {
  type: "object",
  required: ["skills"],
  properties: {
    skills: skillSchema,
    region: {
      type: "string",
      enum: ["US", "EU", "UK", "CA", "AU", "IN", "NG", "LATAM", "APAC"],
    },
    experienceYears: { type: "number", minimum: 0, maximum: 50 },
    saveResult: { type: "boolean", default: false },
  },
};

const jobRequestSchema = {
  type: "object",
  required: ["skills"],
  properties: {
    skills: skillSchema,
    region: { type: "string" },
    experienceYears: { type: "number" },
    webhookUrl: { type: "string", format: "uri" },
    metadata: { type: "object" },
  },
};

module.exports = {
  skillSchema,
  predictionRequestSchema,
  jobRequestSchema,
};
