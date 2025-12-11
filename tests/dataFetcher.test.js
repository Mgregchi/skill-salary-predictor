const { loadData, cache, validatePayload } = require("../core/data");

describe("data fetcher", () => {
  beforeEach(() => {
    cache.clear();
  });

  test("caches successful load and reuses within TTL", async () => {
    const payload = {
      baseSalaries: { US: 1 },
      skills: {},
      experience: {},
      combos: [],
      currencies: {},
    };
    const loader = jest.fn().mockResolvedValue(payload);

    const first = await loadData({ loader, cacheKey: "test", ttlMs: 1000, timeoutMs: 100 });
    expect(first.data).toEqual(payload);
    expect(first.source).toBe("live");
    expect(loader).toHaveBeenCalledTimes(1);

    const second = await loadData({ loader, cacheKey: "test", ttlMs: 1000, timeoutMs: 100 });
    expect(second.data).toEqual(payload);
    expect(second.source).toBe("cache");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test("returns stale cache when refresh fails and allowStale is true", async () => {
    const payload = {
      baseSalaries: { US: 1 },
      skills: {},
      experience: {},
      combos: [],
      currencies: {},
    };

    const successLoader = jest.fn().mockResolvedValue(payload);
    await loadData({ loader: successLoader, cacheKey: "stale", ttlMs: 1, timeoutMs: 100 });
    expect(successLoader).toHaveBeenCalledTimes(1);

    const failingLoader = jest.fn().mockRejectedValue(new Error("boom"));
    const result = await loadData({
      loader: failingLoader,
      cacheKey: "stale",
      ttlMs: -1, // force expiration
      timeoutMs: 100,
      allowStale: true,
    });

    expect(result.data).toEqual(payload);
    expect(result.stale).toBe(true);
    expect(result.source).toBe("stale-cache");
    expect(failingLoader).toHaveBeenCalledTimes(1);
  });

  test("validatePayload guards required keys", () => {
    expect(validatePayload(null)).toBe(false);
    expect(validatePayload({})).toBe(false);
    expect(
      validatePayload({
        baseSalaries: {},
        skills: {},
        experience: {},
        combos: [],
        currencies: {},
      })
    ).toBe(true);
  });
});
