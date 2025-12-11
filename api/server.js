// api/server.js
/**
 * Fastify API Server for Skill-to-Salary Prediction
 * With Prisma ORM and Job Scheduling
 */

const fastify = require("fastify")({ logger: true });
const { PrismaClient } = require("@prisma/client");

// Import route handlers
const healthRoutes = require("./routes/health");
const predictionRoutes = require("./routes/predictions");
const jobRoutes = require("./routes/jobs");
const analyticsRoutes = require("./routes/analytics");
const webhookRoutes = require("./routes/webhooks");

// Initialize Prisma
const prisma = new PrismaClient();

// Register plugins
// Rate limiting
fastify.register(require("@fastify/rate-limit"), {
  max: 100,
  timeWindow: "1 minute",
});

// CORS
fastify.register(require("@fastify/cors"), {
  origin: true,
});

// Swagger documentation
fastify.register(require("@fastify/swagger"), {
  swagger: {
    info: {
      title: "Salary Prediction API",
      description: "Open-source skill-to-salary prediction API",
      version: "1.0.0",
    },
    tags: [
      { name: "predictions", description: "Salary prediction endpoints" },
      { name: "jobs", description: "Job queue endpoints" },
      { name: "analytics", description: "Analytics endpoints" },
    ],
  },
});

fastify.register(require("@fastify/swagger-ui"), {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
});

// Register route plugins
fastify.register(healthRoutes);
fastify.register(predictionRoutes);
fastify.register(jobRoutes);
fastify.register(analyticsRoutes);
fastify.register(webhookRoutes);

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.code(error.statusCode || 500).send({
    error: error.message,
    statusCode: error.statusCode || 500,
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info(`Server listening at http://localhost:3000`);
    fastify.log.info(`API Docs available at http://localhost:3000/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

module.exports = fastify;
