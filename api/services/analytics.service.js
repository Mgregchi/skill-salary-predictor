/**
 * api/services/analytics.service.js
 * Service for handling analytics and statistics
 */

class AnalyticsService {
  /**
   * Calculate salary trends from predictions
   * @param {object[]} predictions - Array of prediction records
   * @returns {object} Statistics object
   */
  calculateTrends(predictions) {
    if (predictions.length === 0) {
      return {
        count: 0,
        statistics: {
          average: 0,
          median: 0,
          min: 0,
          max: 0,
        },
        recentPredictions: [],
      };
    }

    const salaries = predictions.map((p) => p.estimatedSalary);
    const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    const sorted = [...salaries].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      count: predictions.length,
      statistics: {
        average: Math.round(avg),
        median,
        min: Math.min(...salaries),
        max: Math.max(...salaries),
      },
      recentPredictions: predictions.slice(0, 10),
    };
  }

  /**
   * Calculate top skills by occurrence and average salary
   * @param {object[]} predictions - Array of prediction records
   * @param {number} limit - Number of top skills to return
   * @returns {object[]} Array of top skills with stats
   */
  getTopSkills(predictions, limit = 20) {
    const skillStats = {};

    predictions.forEach((p) => {
      const skills = p.skills.split(",");
      skills.forEach((skill) => {
        const normalized = skill.trim().toLowerCase();
        if (!skillStats[normalized]) {
          skillStats[normalized] = { count: 0, totalSalary: 0 };
        }
        skillStats[normalized].count++;
        skillStats[normalized].totalSalary += p.estimatedSalary;
      });
    });

    return Object.entries(skillStats)
      .map(([skill, stats]) => ({
        skill,
        count: stats.count,
        averageSalary: Math.round(stats.totalSalary / stats.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

module.exports = new AnalyticsService();
