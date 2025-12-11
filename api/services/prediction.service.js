/**
 * api/services/prediction.service.js
 * Service for handling prediction logic
 */

const { SalaryPredictor } = require("../../core/predictor");

class PredictionService {
  /**
   * Predict salary for given skills
   * @param {string[]} skills - Array of skills
   * @param {object} options - Options object
   * @param {string} options.region - Region code
   * @param {number} options.experienceYears - Years of experience
   * @returns {object} Prediction result
   */
  predict(skills, options = {}) {
    const { region = "US", experienceYears = 0 } = options;
    const predictor = new SalaryPredictor({ region, experienceYears });
    return predictor.predict(skills);
  }

  /**
   * Batch predict salaries for multiple skill sets
   * @param {string[][]} skillSets - Array of skill arrays
   * @param {object} options - Options object
   * @param {string} options.region - Region code
   * @param {number} options.experienceYears - Years of experience
   * @returns {object[]} Array of prediction results
   */
  batchPredict(skillSets, options = {}) {
    const { region = "US", experienceYears = 0 } = options;
    const predictor = new SalaryPredictor({ region, experienceYears });
    return predictor.batchPredict(skillSets);
  }

  /**
   * Get supported skills
   * @returns {string[]} Array of supported skills
   */
  getSupportedSkills() {
    const predictor = new SalaryPredictor();
    return predictor.getSupportedSkills();
  }

  /**
   * Get supported regions
   * @returns {string[]} Array of supported regions
   */
  getSupportedRegions() {
    const predictor = new SalaryPredictor();
    return predictor.getSupportedRegions();
  }
}

module.exports = new PredictionService();
