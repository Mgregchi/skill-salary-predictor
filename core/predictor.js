// core/predictor.js
/**
 * Skill-to-Salary Prediction Engine
 * Open-source modular system for salary prediction based on tech stack
 */

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
      baseSalaries: {
        US: 75000,
        EU: 55000,
        UK: 60000,
        CA: 70000,
        AU: 72000,
        IN: 25000,
        NG: 18000,
        LATAM: 35000,
        APAC: 45000,
      },

      // Skill multipliers (percentage increase)
      skills: {
        // Languages
        javascript: 1.0,
        typescript: 1.15,
        python: 1.2,
        go: 1.25,
        rust: 1.3,
        java: 1.1,
        kotlin: 1.15,
        swift: 1.2,
        cpp: 1.2,
        csharp: 1.15,
        ruby: 1.05,
        php: 0.95,
        scala: 1.25,
        elixir: 1.2,

        // Frontend
        react: 1.15,
        vue: 1.1,
        angular: 1.1,
        svelte: 1.15,
        nextjs: 1.2,
        nuxt: 1.15,

        // Backend
        nodejs: 1.1,
        express: 1.05,
        fastify: 1.1,
        nestjs: 1.15,
        django: 1.15,
        flask: 1.1,
        rails: 1.1,
        spring: 1.15,

        // Databases
        postgresql: 1.15,
        mongodb: 1.1,
        mysql: 1.05,
        redis: 1.15,
        elasticsearch: 1.2,
        dynamodb: 1.15,
        cassandra: 1.2,

        // Cloud & DevOps
        aws: 1.25,
        azure: 1.2,
        gcp: 1.2,
        docker: 1.15,
        kubernetes: 1.3,
        terraform: 1.25,
        ansible: 1.15,
        jenkins: 1.1,
        githubactions: 1.15,

        // Data & ML
        machinelearning: 1.35,
        deeplearning: 1.4,
        tensorflow: 1.3,
        pytorch: 1.35,
        pandas: 1.15,
        spark: 1.25,
        airflow: 1.2,

        // Mobile
        reactnative: 1.15,
        flutter: 1.2,
        ios: 1.2,
        android: 1.15,

        // Other
        graphql: 1.15,
        grpc: 1.2,
        microservices: 1.2,
        blockchain: 1.3,
        webassembly: 1.25,
        cybersecurity: 1.3,
      },

      // Experience multipliers (per year)
      experience: {
        perYear: 0.05, // 5% per year
        maxYears: 15, // Cap at 15 years
        seniorBonus: 0.2, // 20% bonus at 5+ years
      },

      // Combination bonuses (synergies)
      combos: [
        { skills: ["react", "typescript", "nodejs"], bonus: 0.15 },
        { skills: ["python", "machinelearning", "tensorflow"], bonus: 0.25 },
        { skills: ["kubernetes", "aws", "terraform"], bonus: 0.2 },
        { skills: ["go", "microservices", "grpc"], bonus: 0.18 },
        { skills: ["rust", "webassembly"], bonus: 0.22 },
        { skills: ["react", "nextjs", "typescript"], bonus: 0.18 },
      ],
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
    const currencies = {
      US: "USD",
      EU: "EUR",
      UK: "GBP",
      CA: "CAD",
      AU: "AUD",
      IN: "INR",
      NG: "NGN",
      LATAM: "USD",
      APAC: "USD",
    };
    return currencies[region] || "USD";
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
