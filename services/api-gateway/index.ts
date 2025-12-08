import Fastify from "fastify";
import cors from "@fastify/cors";

const server = Fastify();

// Enable CORS for frontend integration
server.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true
});

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
