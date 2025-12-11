// core/data/httpLoader.js
// Convenience helper to build an HTTP-based data loader

const https = require("https");
const http = require("http");

function createHttpLoader({
  url,
  token,
  headers = {},
  timeoutMs = 3000,
  transform,
} = {}) {
  if (!url) {
    throw new Error("createHttpLoader: url is required");
  }

  const client = url.startsWith("https") ? https : http;

  return async function httpLoader() {
    const mergedHeaders = { ...headers };
    if (token) {
      mergedHeaders.Authorization = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const req = client.get(url, { headers: mergedHeaders, timeout: timeoutMs }, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve(transform ? transform(json) : json);
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on("timeout", () => {
        req.destroy(new Error("HTTP loader timeout"));
      });

      req.on("error", (err) => {
        reject(err);
      });
    });
  };
}

module.exports = { createHttpLoader };
