import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "./app.js";

describe("GET /api/health", () => {
  it("returns backend health metadata", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "helpdesk-ia-api"
    });
    expect(["demo", "gemini"]).toContain(response.body.aiProvider);
    expect(response.body.timestamp).toEqual(expect.any(String));
  });
});
