/**
 * api/routes/jobs.js
 * Job queue endpoints
 */

const { PrismaClient } = require("@prisma/client");
const jobService = require("../services/job.service");
const { jobRequestSchema } = require("../schemas");

const prisma = new PrismaClient();

module.exports = async function jobRoutes(fastify, options) {
  /**
   * POST /api/jobs - Schedule prediction job
   */
  fastify.post(
    "/api/jobs",
    {
      schema: {
        tags: ["jobs"],
        body: jobRequestSchema,
      },
    },
    async (request, reply) => {
      const {
        skills,
        region = "US",
        experienceYears = 0,
        webhookUrl,
        metadata,
      } = request.body;

      const job = await jobService.scheduleJob(skills, {
        region,
        experienceYears,
        webhookUrl,
        metadata,
      });

      // Save job to database
      try {
        await prisma.job.create({
          data: {
            jobId: job.jobId,
            skills: skills.join(","),
            region,
            experienceYears,
            status: job.status,
            webhookUrl,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });
      } catch (error) {
        fastify.log.error("Failed to save job:", error);
      }

      return {
        jobId: job.jobId,
        status: job.status,
        statusUrl: `/api/jobs/${job.jobId}`,
      };
    }
  );

  /**
   * GET /api/jobs/:jobId - Get job status
   */
  fastify.get(
    "/api/jobs/:jobId",
    {
      schema: {
        tags: ["jobs"],
        params: {
          type: "object",
          properties: {
            jobId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { jobId } = request.params;

      const job = jobService.getJob(jobId);

      if (!job) {
        // Check database
        const dbJob = await prisma.job.findUnique({
          where: { jobId },
        });

        if (!dbJob) {
          return reply.code(404).send({ error: "Job not found" });
        }

        return dbJob;
      }

      // Update database
      if (job.status === "completed" || job.status === "failed") {
        await prisma.job
          .update({
            where: { jobId },
            data: {
              status: job.status,
              result: job.result ? JSON.stringify(job.result) : null,
              error: job.error,
              completedAt: job.completedAt ? new Date(job.completedAt) : null,
            },
          })
          .catch((err) => fastify.log.error("Failed to update job:", err));
      }

      return job;
    }
  );
};
