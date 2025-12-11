// core/predictor.js
/**
 * Skill-to-Salary Prediction Engine
 * Open-source modular system for salary prediction based on tech stack
 */

const data = require("./data");

class SalaryPredictor {
  constructor(options = {}) {
    this.region = options.region || "US";
    this.experienceYears = options.experienceYears || 0;
    this.modelWeights = this.initializeWeights();
  }

  /**
   * Initialize skill weights and base salaries per region
   */
  initializeWeights() {
    return {
      baseSalaries: data.baseSalaries,
      skills: data.skills,
      experience: data.experience,
      combos: data.combos,
    };
  }

  /**
   * Predict salary based on skills
   * @param {Array<string>} skills - Array of skill names
   * @returns {Object} Prediction result
   */
  predict(skills) {
    const startTime = Date.now();

    // Normalize skills to lowercase
    const normalizedSkills = skills.map((s) =>
      s.toLowerCase().replace(/[\s.-]/g, "")
    );

    // Get base salary for region
    const baseSalary =
      this.modelWeights.baseSalaries[this.region] ||
      this.modelWeights.baseSalaries.US;

    // Calculate skill multiplier
    let skillMultiplier = 1.0;
    const matchedSkills = [];
    const unmatchedSkills = [];

    normalizedSkills.forEach((skill) => {
      const weight = this.modelWeights.skills[skill];
      if (weight) {
        skillMultiplier += weight - 1.0;
        matchedSkills.push(skill);
      } else {
        unmatchedSkills.push(skill);
      }
    });

    // Apply combo bonuses
    let comboBonus = 0;
    const activeCombo = [];
    this.modelWeights.combos.forEach((combo) => {
      const hasCombo = combo.skills.every((s) => normalizedSkills.includes(s));
      if (hasCombo) {
        comboBonus += combo.bonus;
        activeCombo.push(combo.skills.join("+"));
      }
    });

    // Apply experience multiplier
    const cappedYears = Math.min(
      this.experienceYears,
      this.modelWeights.experience.maxYears
    );
    const experienceMultiplier =
      1.0 + cappedYears * this.modelWeights.experience.perYear;
    const seniorBonus =
      this.experienceYears >= 5 ? this.modelWeights.experience.seniorBonus : 0;

    // Calculate final salary
    const totalMultiplier =
      skillMultiplier * experienceMultiplier * (1 + comboBonus + seniorBonus);
    const estimatedSalary = Math.round(baseSalary * totalMultiplier);

    // Calculate percentile and range
    const minSalary = Math.round(estimatedSalary * 0.85);
    const maxSalary = Math.round(estimatedSalary * 1.2);

    const executionTime = Date.now() - startTime;

    return {
      estimatedSalary,
      salaryRange: { min: minSalary, max: maxSalary },
      currency: this.getCurrency(this.region),
      region: this.region,
      experienceYears: this.experienceYears,
      breakdown: {
        baseSalary,
        skillMultiplier: Math.round(skillMultiplier * 100) / 100,
        experienceMultiplier: Math.round(experienceMultiplier * 100) / 100,
        comboBonus: Math.round(comboBonus * 100) / 100,
        seniorBonus: Math.round(seniorBonus * 100) / 100,
        totalMultiplier: Math.round(totalMultiplier * 100) / 100,
      },
      skills: {
        matched: matchedSkills,
        unmatched: unmatchedSkills,
        total: normalizedSkills.length,
      },
      activeCombos: activeCombo,
      confidence: this.calculateConfidence(
        matchedSkills.length,
        normalizedSkills.length
      ),
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Batch predict for multiple skill sets
   * @param {Array<Array<string>>} skillSets - Array of skill arrays
   * @returns {Array<Object>} Array of predictions
   */
  batchPredict(skillSets) {
    return skillSets.map((skills) => this.predict(skills));
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(matched, total) {
    if (total === 0) return 0;
    const matchRate = matched / total;
    const skillCount = Math.min(matched / 10, 1); // More skills = higher confidence
    return Math.round((matchRate * 0.7 + skillCount * 0.3) * 100);
  }

  /**
   * Get currency for region
   */
  getCurrency(region) {
    return data.currencies[region] || "USD";
  }

  /**
   * Get all supported skills
   */
  getSupportedSkills() {
    return Object.keys(this.modelWeights.skills).sort();
  }

  /**
   * Get all supported regions
   */
  getSupportedRegions() {
    return Object.keys(this.modelWeights.baseSalaries);
  }

  /**
   * Update region
   */
  setRegion(region) {
    this.region = region;
    return this;
  }

  /**
   * Update experience
   */
  setExperience(years) {
    this.experienceYears = years;
    return this;
  }
}

// Job Queue for async processing
class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.jobCounter = 0;
  }

  /**
   * Schedule a prediction job
   */
  async scheduleJob(skills, options = {}) {
    const jobId = `job_${++this.jobCounter}_${Date.now()}`;
    const job = {
      id: jobId,
      status: "pending",
      skills,
      options,
      createdAt: Date.now(),
      result: null,
      error: null,
    };

    this.jobs.set(jobId, job);

    // Process job asynchronously
    setImmediate(async () => {
      try {
        job.status = "processing";
        const predictor = new SalaryPredictor(options);
        const result = predictor.predict(skills);

        job.result = result;
        job.status = "completed";
        job.completedAt = Date.now();

        // Trigger webhook if provided
        if (options.webhookUrl) {
          await this.triggerWebhook(options.webhookUrl, {
            jobId,
            status: "completed",
            result,
          });
        }
      } catch (error) {
        job.status = "failed";
        job.error = error.message;
        job.completedAt = Date.now();

        if (options.webhookUrl) {
          await this.triggerWebhook(options.webhookUrl, {
            jobId,
            status: "failed",
            error: error.message,
          });
        }
      }
    });

    return { jobId, status: "pending" };
  }

  /**
   * Get job status
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Trigger webhook notification
   */
  async triggerWebhook(url, data) {
    try {
      // In real implementation, use fetch or axios
      console.log(`Webhook triggered: ${url}`, data);
      return true;
    } catch (error) {
      console.error("Webhook failed:", error);
      return false;
    }
  }

  /**
   * Clean up old jobs
   */
  cleanup(olderThanMs = 3600000) {
    // 1 hour default
    const now = Date.now();
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && now - job.completedAt > olderThanMs) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SalaryPredictor, JobQueue };
}

// Example usage
if (require.main === module) {
  // Quick prediction
  const predictor = new SalaryPredictor({
    region: "US",
    experienceYears: 5,
  });

  const result = predictor.predict([
    "React",
    "TypeScript",
    "Node.js",
    "AWS",
    "Docker",
    "PostgreSQL",
  ]);

  console.log("Salary Prediction:", result);
  console.log(`\nEstimated: $${result.estimatedSalary.toLocaleString()}`);
  console.log(
    `Range: $${result.salaryRange.min.toLocaleString()} - $${result.salaryRange.max.toLocaleString()}`
  );
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Execution Time: ${result.executionTimeMs}ms`);

  // Job queue example
  const queue = new JobQueue();
  queue
    .scheduleJob(["Python", "TensorFlow", "Kubernetes"], {
      region: "US",
      experienceYears: 8,
      webhookUrl: "https://example.com/webhook",
    })
    .then((job) => {
      console.log("\nScheduled Job:", job);

      // Check status after a delay
      setTimeout(() => {
        const status = queue.getJob(job.jobId);
        console.log("Job Status:", status);
      }, 100);
    });
}
