import request from "supertest";
import app from "../services/billing/billing_service"; // Assuming app is the Fastify instance

describe("Billing Service Unit Tests", () => {
  it("should list subscription plans", async () => {
    const response = await request(app.server).get("/plans").expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("should create a subscription", async () => {
    const response = await request(app.server)
      .post("/subscriptions")
      .send({
        customerId: "cus_123",
        planId: "basic",
        paymentMethodId: "pm_123",
      })
      .expect(201);

    expect(response.body.message).toBe("Subscription created successfully");
    expect(response.body.subscription).toBeDefined();
  });

  it("should return 400 for missing fields in subscription creation", async () => {
    const response = await request(app.server)
      .post("/subscriptions")
      .send({})
      .expect(400);

    expect(response.body.error).toBe("Missing required fields");
  });

  it("should cancel a subscription", async () => {
    const response = await request(app.server)
      .delete("/subscriptions/sub_123")
      .expect(200);

    expect(response.body.message).toBe("Subscription cancelled successfully");
  });
});
