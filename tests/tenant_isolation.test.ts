import request from "supertest";
import app from "../services/app"; // Assuming app is the main Express app

describe("Tenant Isolation Tests", () => {
  it("should prevent cross-tenant data access", async () => {
    const tenant1Token = "token-for-tenant-1";
    const tenant2Token = "token-for-tenant-2";

    // Tenant 1 creates a resource
    await request(app)
      .post("/api/resource")
      .set("Authorization", `Bearer ${tenant1Token}`)
      .send({ data: "Tenant 1 data" })
      .expect(201);

    // Tenant 2 tries to access Tenant 1's resource
    const response = await request(app)
      .get("/api/resource")
      .set("Authorization", `Bearer ${tenant2Token}`)
      .expect(403);

    expect(response.body.error).toBe("Access denied");
  });

  it("should allow access to tenant-specific data", async () => {
    const tenant1Token = "token-for-tenant-1";

    // Tenant 1 creates a resource
    await request(app)
      .post("/api/resource")
      .set("Authorization", `Bearer ${tenant1Token}`)
      .send({ data: "Tenant 1 data" })
      .expect(201);

    // Tenant 1 accesses their own resource
    const response = await request(app)
      .get("/api/resource")
      .set("Authorization", `Bearer ${tenant1Token}`)
      .expect(200);

    expect(response.body.data).toBe("Tenant 1 data");
  });
});
