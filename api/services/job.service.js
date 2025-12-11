/**
 * api/services/job.service.js
 * Service for handling job queue operations
 */

const { JobQueue } = require("../../core/predictor");

class JobService {
  constructor() {
    this.jobQueue = new JobQueue();
    // Cleanup old jobs every hour
    setInterval(() => this.jobQueue.cleanup(), 3600000);
  }

  /**
   * Schedule a prediction job
   * @param {string[]} skills - Array of skills
   * @param {object} options - Options object
   * @param {string} options.region - Region code
   * @param {number} options.experienceYears - Years of experience
   * @param {string} options.webhookUrl - Optional webhook URL
   * @param {object} options.metadata - Optional metadata
   * @returns {object} Job info with jobId and status
   */
  async scheduleJob(skills, options = {}) {
    const {
      region = "US",
      experienceYears = 0,
      webhookUrl,
      metadata,
    } = options;

    return await this.jobQueue.scheduleJob(skills, {
      region,
      experienceYears,
      webhookUrl,
      metadata,
    });
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {object} Job information
   */
  getJob(jobId) {
    return this.jobQueue.getJob(jobId);
  }

  /**
   * Get the job queue instance
   * @returns {JobQueue} Job queue instance
   */
  getJobQueue() {
    return this.jobQueue;
  }
}

module.exports = new JobService();
