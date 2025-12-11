const { SalaryPredictor } = require("../core/predictor");

describe("SalaryPredictor live data", () => {
  test("uses live data via predictAsync", async () => {
    const loader = async () => ({
      baseSalaries: { US: 100000 },
      skills: { python: 2 },
      experience: { perYear: 0, maxYears: 10, seniorBonus: 0 },
      combos: [],
      currencies: { US: "USD" },
    });

    const predictor = new SalaryPredictor({
      dataSource: { mode: "live", loader, cacheKey: "live-test" },
    });

    const result = await predictor.predictAsync(["Python"]);
    expect(result.estimatedSalary).toBe(200000);
    expect(result.currency).toBe("USD");
    expect(predictor.getDataInfo().source).toMatch(/live|cache/);
  });

  test("falls back to static data when live load fails", async () => {
    const onWarning = jest.fn();
    const loader = async () => {
      throw new Error("network down");
    };

    const predictor = new SalaryPredictor({
      dataSource: { mode: "live", loader, cacheKey: "live-fail", onWarning },
    });

    const result = await predictor.predictAsync(["Python"]);
    expect(result.currency).toBe("USD");
    expect(predictor.getDataInfo().source).toBe("static-fallback");
    expect(onWarning).toHaveBeenCalled();
  });
});
