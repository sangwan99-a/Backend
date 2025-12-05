import request from "supertest";
import app from "../services/plugin_registry/plugin_registry"; // Assuming app is the Fastify instance

describe("Plugin Marketplace Integration Tests", () => {
  it("should submit a new plugin", async () => {
    const response = await request(app.server)
      .post("/plugins")
      .send({
        name: "pluginX",
        version: "1.0.0",
        description: "A test plugin",
        developer: "dev123",
        code: 'console.log("Hello, Plugin!");',
      })
      .expect(201);

    expect(response.body.message).toBe("Plugin submitted successfully");
  });

  it("should list all plugins", async () => {
    const response = await request(app.server).get("/plugins").expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("should fetch plugin details", async () => {
    const response = await request(app.server)
      .get("/plugins/pluginX")
      .expect(200);

    expect(response.body.name).toBe("pluginX");
    expect(response.body.version).toBe("1.0.0");
  });

  it("should return 404 for non-existent plugin", async () => {
    const response = await request(app.server)
      .get("/plugins/nonexistent")
      .expect(404);

    expect(response.body.error).toBe("Plugin not found");
  });
});
