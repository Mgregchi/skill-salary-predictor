/**
 * api/routes/health.js
 * Health check endpoint
 */

module.exports = async function healthRoutes(fastify, options) {
  /**
   * GET /health - Health check
   */
  fastify.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });
};
