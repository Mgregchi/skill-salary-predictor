/**
 * api/routes/webhooks.js
 * Webhook endpoints
 */

const webhookService = require("../services/webhook.service");

module.exports = async function webhookRoutes(fastify, options) {
  /**
   * POST /api/webhooks/test - Test webhook
   */
  fastify.post("/api/webhooks/test", async (request, reply) => {
    const { url, data } = request.body;

    const result = await webhookService.testWebhook(url, data);
    return result;
  });
};
