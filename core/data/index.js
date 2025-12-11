// core/data/index.js
// Aggregates model data for SalaryPredictor

const baseSalaries = require("./baseSalaries");
const skills = require("./skills");
const experience = require("./experience");
const combos = require("./combos");
const currencies = require("./currencies");

module.exports = {
  baseSalaries,
  skills,
  experience,
  combos,
  currencies,
};
