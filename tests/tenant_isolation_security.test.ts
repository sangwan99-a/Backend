import request from "supertest";
import app from "../services/app"; // Assuming app is the main Express app

describe("Tenant Isolation Security Tests", () => {
  it("should prevent unauthorized access to another tenant’s data", async () => {
    const tenant1Token = "token-for-tenant-1";
    const tenant2Token = "token-for-tenant-2";

    // Tenant 1 tries to access Tenant 2's analytics
    const response = await request(app)
      .get("/analytics/tenant2")
      .set("Authorization", `Bearer ${tenant1Token}`)
      .expect(403);

    expect(response.body.error).toBe("Access denied");
  });

  it("should allow authorized access to tenant-specific data", async () => {
    const tenant1Token = "token-for-tenant-1";

    // Tenant 1 accesses their own analytics
    const response = await request(app)
      .get("/analytics/tenant1")
      .set("Authorization", `Bearer ${tenant1Token}`)
      .expect(200);

    expect(response.body.apiCalls).toBeDefined();
    expect(response.body.storageUsed).toBeDefined();
  });
});
