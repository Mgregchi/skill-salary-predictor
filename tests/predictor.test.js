// tests/predictor.test.js
const { SalaryPredictor, JobQueue } = require("../core/predictor");

describe("SalaryPredictor", () => {
  let predictor;

  beforeEach(() => {
    predictor = new SalaryPredictor({
      region: "US",
      experienceYears: 5,
    });
  });

  test("predicts salary for valid skills", () => {
    const result = predictor.predict(["React", "TypeScript", "Node.js"]);

    expect(result.estimatedSalary).toBeGreaterThan(0);
    expect(result.currency).toBe("USD");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.executionTimeMs).toBeLessThan(100);
  });

  test("handles unmatched skills gracefully", () => {
    const result = predictor.predict(["UnknownSkill", "FakeFramework"]);

    expect(result.skills.unmatched).toHaveLength(2);
    expect(result.estimatedSalary).toBeGreaterThan(0);
  });

  test("applies combo bonuses correctly", () => {
    const withCombo = predictor.predict(["React", "TypeScript", "Node.js"]);
    const withoutCombo = predictor.predict(["React"]);

    expect(withCombo.estimatedSalary).toBeGreaterThan(
      withoutCombo.estimatedSalary
    );
    expect(withCombo.activeCombos.length).toBeGreaterThan(0);
  });

  test("adjusts for experience", () => {
    const junior = new SalaryPredictor({ region: "US", experienceYears: 0 });
    const senior = new SalaryPredictor({ region: "US", experienceYears: 10 });

    const juniorResult = junior.predict(["JavaScript"]);
    const seniorResult = senior.predict(["JavaScript"]);

    expect(seniorResult.estimatedSalary).toBeGreaterThan(
      juniorResult.estimatedSalary
    );
  });

  test("varies by region", () => {
    const us = new SalaryPredictor({ region: "US", experienceYears: 5 });
    const eu = new SalaryPredictor({ region: "EU", experienceYears: 5 });

    const usResult = us.predict(["Python"]);
    const euResult = eu.predict(["Python"]);

    expect(usResult.currency).toBe("USD");
    expect(euResult.currency).toBe("EUR");
    expect(usResult.estimatedSalary).not.toBe(euResult.estimatedSalary);
  });

  test("batch prediction works", () => {
    const skillSets = [
      ["React", "TypeScript"],
      ["Python", "Django"],
      ["Go", "Kubernetes"],
    ];

    const results = predictor.batchPredict(skillSets);

    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result.estimatedSalary).toBeGreaterThan(0);
    });
  });

  test("returns all supported skills", () => {
    const skills = predictor.getSupportedSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(50);
    expect(skills).toContain("javascript");
    expect(skills).toContain("python");
  });
});

describe("JobQueue", () => {
  let queue;

  beforeEach(() => {
    queue = new JobQueue();
  });

  test("schedules job successfully", async () => {
    const job = await queue.scheduleJob(["React", "TypeScript"], {
      region: "US",
      experienceYears: 5,
    });

    expect(job.jobId).toBeDefined();
    expect(job.status).toBe("pending");
  });

  test("completes job and returns result", async () => {
    const job = await queue.scheduleJob(["Python"], {
      region: "US",
      experienceYears: 3,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    const status = queue.getJob(job.jobId);

    expect(status.status).toBe("completed");
    expect(status.result).toBeDefined();
    expect(status.result.estimatedSalary).toBeGreaterThan(0);
  });

  test("handles job errors", async () => {
    // Simulate error by providing invalid data
    const job = await queue.scheduleJob(null, {});

    await new Promise((resolve) => setTimeout(resolve, 100));
    const status = queue.getJob(job.jobId);

    expect(status.status).toBe("failed");
    expect(status.error).toBeDefined();
  });
});

// examples/client.js
/**
 * Client Examples for Skill-to-Salary Prediction API
 */

const API_BASE_URL = "http://localhost:3000";

// Example 1: Quick Prediction
async function quickPrediction() {
  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
      region: "US",
      experienceYears: 5,
      saveResult: true,
    }),
  });

  const result = await response.json();
  console.log("Quick Prediction:");
  console.log(`Estimated Salary: $${result.estimatedSalary.toLocaleString()}`);
  console.log(
    `Range: $${result.salaryRange.min.toLocaleString()} - $${result.salaryRange.max.toLocaleString()}`
  );
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Execution Time: ${result.executionTimeMs}ms\n`);

  return result;
}

// Example 2: Scheduled Job with Webhook
async function scheduledJob() {
  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skills: ["Python", "TensorFlow", "Kubernetes", "AWS"],
      region: "US",
      experienceYears: 8,
      webhookUrl: "https://your-app.com/webhook",
      metadata: {
        userId: "user_123",
        requestSource: "mobile_app",
        timestamp: Date.now(),
      },
    }),
  });

  const job = await response.json();
  console.log("Scheduled Job:");
  console.log(`Job ID: ${job.jobId}`);
  console.log(`Status: ${job.status}`);
  console.log(`Status URL: ${API_BASE_URL}${job.statusUrl}\n`);

  // Poll for completion
  await pollJobStatus(job.jobId);

  return job;
}

// Example 3: Poll Job Status
async function pollJobStatus(jobId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
    const status = await response.json();

    console.log(`Job ${jobId} status: ${status.status}`);

    if (status.status === "completed") {
      console.log("Job completed!");
      console.log(
        `Salary: $${status.result.estimatedSalary.toLocaleString()}\n`
      );
      return status;
    }

    if (status.status === "failed") {
      console.error("Job failed:", status.error);
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Job polling timeout");
}

// Example 4: Batch Processing
async function batchProcessing() {
  const skillSets = [
    ["React", "TypeScript", "Node.js"],
    ["Python", "Django", "PostgreSQL"],
    ["Go", "Kubernetes", "Docker"],
    ["Java", "Spring", "MySQL"],
    ["Rust", "WebAssembly"],
  ];

  const response = await fetch(`${API_BASE_URL}/api/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skillSets,
      region: "US",
      experienceYears: 5,
    }),
  });

  const data = await response.json();
  console.log("Batch Processing:");
  console.log(`Processed ${data.count} skill sets`);
  console.log(`Total time: ${data.totalExecutionTimeMs}ms\n`);

  data.results.forEach((result, index) => {
    console.log(
      `Set ${index + 1}: $${result.estimatedSalary.toLocaleString()}`
    );
  });
  console.log();

  return data;
}

// Example 5: Compare Regions
async function compareRegions() {
  const skills = ["React", "TypeScript", "Node.js", "AWS"];
  const regions = ["US", "EU", "UK", "CA", "AU"];

  console.log("Regional Comparison:");
  console.log("Skills:", skills.join(", "));
  console.log("Experience: 5 years\n");

  const results = await Promise.all(
    regions.map(async (region) => {
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills, region, experienceYears: 5 }),
      });
      return { region, ...(await response.json()) };
    })
  );

  results.forEach((result) => {
    console.log(
      `${result.region}: ${
        result.currency
      } ${result.estimatedSalary.toLocaleString()}`
    );
  });
  console.log();

  return results;
}

// Example 6: Analytics - Top Skills
async function getTopSkills() {
  const response = await fetch(`${API_BASE_URL}/api/analytics/skills?limit=10`);
  const data = await response.json();

  console.log("Top 10 Skills by Demand:");
  data.topSkills.forEach((skill, index) => {
    console.log(
      `${index + 1}. ${skill.skill} - Count: ${
        skill.count
      }, Avg Salary: $${skill.averageSalary.toLocaleString()}`
    );
  });
  console.log();

  return data;
}

// Example 7: Salary Trends
async function getSalaryTrends() {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/trends?region=US&limit=100`
  );
  const data = await response.json();

  console.log("Salary Trends (US):");
  console.log(`Total Predictions: ${data.count}`);
  console.log(`Average: $${data.statistics.average.toLocaleString()}`);
  console.log(`Median: $${data.statistics.median.toLocaleString()}`);
  console.log(
    `Range: $${data.statistics.min.toLocaleString()} - $${data.statistics.max.toLocaleString()}`
  );
  console.log();

  return data;
}

// Example 8: Career Growth Simulation
async function careerGrowthSimulation() {
  const skills = ["React", "TypeScript", "Node.js"];
  const years = [0, 2, 5, 8, 10, 15];

  console.log("Career Growth Simulation:");
  console.log("Skills:", skills.join(", "), "\n");

  for (const experienceYears of years) {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills, region: "US", experienceYears }),
    });

    const result = await response.json();
    console.log(
      `${experienceYears} years: $${result.estimatedSalary.toLocaleString()}`
    );
  }
  console.log();
}

// Example 9: Skill Impact Analysis
async function skillImpactAnalysis() {
  const baseSkills = ["JavaScript", "Node.js"];
  const additionalSkills = [
    "TypeScript",
    "React",
    "AWS",
    "Docker",
    "Kubernetes",
  ];

  console.log("Skill Impact Analysis:");
  console.log("Base skills:", baseSkills.join(", "), "\n");

  // Get base salary
  const baseResponse = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skills: baseSkills,
      region: "US",
      experienceYears: 3,
    }),
  });
  const baseResult = await baseResponse.json();
  console.log(`Base salary: $${baseResult.estimatedSalary.toLocaleString()}`);

  // Test each additional skill
  for (const skill of additionalSkills) {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: [...baseSkills, skill],
        region: "US",
        experienceYears: 3,
      }),
    });

    const result = await response.json();
    const increase = result.estimatedSalary - baseResult.estimatedSalary;
    const percentage = ((increase / baseResult.estimatedSalary) * 100).toFixed(
      1
    );

    console.log(
      `+ ${skill}: $${result.estimatedSalary.toLocaleString()} (+$${increase.toLocaleString()}, +${percentage}%)`
    );
  }
  console.log();
}

// Run all examples
async function runAllExamples() {
  try {
    await quickPrediction();
    await batchProcessing();
    await compareRegions();
    await careerGrowthSimulation();
    await skillImpactAnalysis();

    // Only run these if database has data
    // await getTopSkills();
    // await getSalaryTrends();

    // Only run if you have a webhook endpoint
    // await scheduledJob();

    console.log("All examples completed!");
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// Uncomment to run
// runAllExamples();

module.exports = {
  quickPrediction,
  scheduledJob,
  batchProcessing,
  compareRegions,
  getTopSkills,
  getSalaryTrends,
  careerGrowthSimulation,
  skillImpactAnalysis,
};
