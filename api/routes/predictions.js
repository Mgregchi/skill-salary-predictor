/**
 * api/routes/predictions.js
 * Prediction endpoints
 */

const { PrismaClient } = require("@prisma/client");
const predictionService = require("../services/prediction.service");
const { predictionRequestSchema, skillSchema } = require("../schemas");

const prisma = new PrismaClient();

module.exports = async function predictionRoutes(fastify, options) {
  /**
   * POST /api/predict - Instant prediction
   */
  fastify.post(
    "/api/predict",
    {
      schema: {
        tags: ["predictions"],
        body: predictionRequestSchema,
        response: {
          200: {
            type: "object",
            properties: {
              estimatedSalary: { type: "number" },
              salaryRange: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" },
                },
              },
              currency: { type: "string" },
              region: { type: "string" },
              confidence: { type: "number" },
              executionTimeMs: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        skills,
        region = "US",
        experienceYears = 0,
        saveResult = false,
      } = request.body;

      const result = predictionService.predict(skills, {
        region,
        experienceYears,
      });

      // Optionally save to database
      if (saveResult) {
        try {
          await prisma.prediction.create({
            data: {
              skills: skills.join(","),
              region,
              experienceYears,
              estimatedSalary: result.estimatedSalary,
              minSalary: result.salaryRange.min,
              maxSalary: result.salaryRange.max,
              confidence: result.confidence,
              metadata: JSON.stringify(result),
            },
          });
        } catch (error) {
          fastify.log.error("Failed to save prediction:", error);
        }
      }

      return result;
    }
  );

  /**
   * POST /api/batch - Batch prediction
   */
  fastify.post(
    "/api/batch",
    {
      schema: {
        tags: ["predictions"],
        body: {
          type: "object",
          required: ["skillSets"],
          properties: {
            skillSets: {
              type: "array",
              items: skillSchema,
            },
            region: { type: "string" },
            experienceYears: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const { skillSets, region = "US", experienceYears = 0 } = request.body;

      const results = predictionService.batchPredict(skillSets, {
        region,
        experienceYears,
      });

      return {
        results,
        count: results.length,
        totalExecutionTimeMs: results.reduce(
          (sum, r) => sum + r.executionTimeMs,
          0
        ),
      };
    }
  );

  /**
   * GET /api/skills - List supported skills
   */
  fastify.get(
    "/api/skills",
    {
      schema: {
        tags: ["predictions"],
      },
    },
    async (request, reply) => {
      const skills = predictionService.getSupportedSkills();

      return {
        skills,
        count: skills.length,
      };
    }
  );

  /**
   * GET /api/regions - List supported regions
   */
  fastify.get(
    "/api/regions",
    {
      schema: {
        tags: ["predictions"],
      },
    },
    async (request, reply) => {
      const regions = predictionService.getSupportedRegions();

      return {
        regions,
        count: regions.length,
      };
    }
  );
};
