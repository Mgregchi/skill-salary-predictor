// core/data/index.js
// Aggregates model data for SalaryPredictor

const baseSalaries = require("./baseSalaries");
const skills = require("./skills");
const experience = require("./experience");
const combos = require("./combos");
const currencies = require("./currencies");
const { loadData, validatePayload, cache } = require("./fetcher");
const { createHttpLoader } = require("./httpLoader");

module.exports = {
  baseSalaries,
  skills,
  experience,
  combos,
  currencies,
  loadData,
  validatePayload,
  cache,
  createHttpLoader,
};
