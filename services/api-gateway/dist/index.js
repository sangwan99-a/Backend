"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const server = (0, fastify_1.default)();
server.get("/", async (request, reply) => {
  return { message: "API Gateway is running" };
});
const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log("API Gateway is running on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
//# sourceMappingURL=index.js.map
