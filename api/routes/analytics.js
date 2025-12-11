/**
 * api/routes/analytics.js
 * Analytics endpoints
 */

const { PrismaClient } = require("@prisma/client");
const analyticsService = require("../services/analytics.service");

const prisma = new PrismaClient();

module.exports = async function analyticsRoutes(fastify, options) {
  /**
   * GET /api/analytics/trends - Get salary trends
   */
  fastify.get(
    "/api/analytics/trends",
    {
      schema: {
        tags: ["analytics"],
        querystring: {
          type: "object",
          properties: {
            region: { type: "string" },
            limit: { type: "number", default: 100 },
          },
        },
      },
    },
    async (request, reply) => {
      const { region, limit = 100 } = request.query;

      const where = region ? { region } : {};

      const predictions = await prisma.prediction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const trends = analyticsService.calculateTrends(predictions);
      return trends;
    }
  );

  /**
   * GET /api/analytics/skills - Get top skills
   */
  fastify.get(
    "/api/analytics/skills",
    {
      schema: {
        tags: ["analytics"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const { limit = 20 } = request.query;

      const predictions = await prisma.prediction.findMany({
        select: { skills: true, estimatedSalary: true },
      });

      const topSkills = analyticsService.getTopSkills(predictions, limit);

      return { topSkills };
    }
  );
};
