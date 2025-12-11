// core/predictor.js
/**
 * Skill-to-Salary Prediction Engine
 * Open-source modular system for salary prediction based on tech stack
 */

const data = require("./data");
const { loadData, DEFAULT_TTL_MS, DEFAULT_TIMEOUT_MS } = data;

class SalaryPredictor {
  constructor(options = {}) {
    this.region = options.region || "US";
    this.experienceYears = options.experienceYears || 0;
    this.dataSource = options.dataSource;
    this.modelWeights = this.initializeWeights();
  }

  defaultWeights(meta = { source: "static" }) {
    return {
      baseSalaries: data.baseSalaries,
      skills: data.skills,
      experience: data.experience,
      combos: data.combos,
      currencies: data.currencies,
      meta,
    };
  }

  /**
   * Initialize skill weights and base salaries per region
   */
  initializeWeights() {
    const source = this.dataSource;

    // Static defaults
    if (!source || source.mode === "static") {
      return this.defaultWeights({ source: "static" });
    }

    // Live / auto mode (with static fallback)
    const {
      loader,
      cacheKey,
      ttlMs = DEFAULT_TTL_MS,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      allowStale = true,
      onWarning,
    } = source;

    // Synchronously kick off load; for simplicity we block constructor with async load via deasync-like pattern is not desired.
    // Instead, we require the loader to be sync-resolvable via async/await before use (constructor is synchronous).
    // So we instantiate with a promise and throw if not resolved when used.
    this._dataLoadPromise = loadData({
      loader,
      cacheKey,
      ttlMs,
      timeoutMs,
      allowStale,
      onWarning,
    });

    // Temporarily return static; actual weights will be replaced on first predictAsync call.
    return this.defaultWeights({ source: "static-pending-live" });
  }

  async ensureLiveData() {
    if (!this._dataLoadPromise) return;
    if (this._dataLoaded) return;

    try {
      const result = await this._dataLoadPromise;
      this.modelWeights = {
        baseSalaries: result.data.baseSalaries,
        skills: result.data.skills,
        experience: result.data.experience,
        combos: result.data.combos,
        currencies: result.data.currencies,
        meta: {
          source: result.source,
          stale: result.stale,
          fetchedAt: result.fetchedAt,
        },
      };
    } catch (error) {
      const onWarning = this.dataSource?.onWarning;
      if (onWarning) {
        onWarning("Falling back to static data", { error: error.message });
      }
      this.modelWeights = this.defaultWeights({
        source: "static-fallback",
        error: error.message,
      });
    } finally {
      this._dataLoaded = true;
      this._dataLoadPromise = null;
    }
  }

  /**
   * Predict salary based on skills
   * @param {Array<string>} skills - Array of skill names
   * @returns {Object} Prediction result
   */
  predict(skills) {
    // If live data was requested, ensure it's loaded before computing.
    if (this._dataLoadPromise) {
      throw new Error(
        "predict called before live data loaded; use predictAsync() or wait for refreshData()"
      );
    }
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

  async predictAsync(skills) {
    await this.ensureLiveData();
    return this.predict(skills);
  }

  async batchPredictAsync(skillSets) {
    await this.ensureLiveData();
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
    return this.modelWeights.currencies[region] || "USD";
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

  /**
   * Refresh live data manually
   */
  async refreshData() {
    if (!this.dataSource || this.dataSource.mode === "static") return this.modelWeights;
    this._dataLoaded = false;
    this._dataLoadPromise = loadData({
      loader: this.dataSource.loader,
      cacheKey: this.dataSource.cacheKey,
      ttlMs: this.dataSource.ttlMs ?? DEFAULT_TTL_MS,
      timeoutMs: this.dataSource.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      allowStale: this.dataSource.allowStale ?? true,
      onWarning: this.dataSource.onWarning,
    });
    await this.ensureLiveData();
    return this.modelWeights;
  }

  /**
   * Get data source info
   */
  getDataInfo() {
    const meta = this.modelWeights.meta || {};
    return {
      source: meta.source || "static",
      stale: meta.stale || false,
      fetchedAt: meta.fetchedAt,
    };
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
