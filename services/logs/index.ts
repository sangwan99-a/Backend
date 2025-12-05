import Fastify from "fastify";

const server = Fastify();

server.get("/", async (request, reply) => {
  return { message: "Logs service is running" };
});

const start = async () => {
  try {
    await server.listen({ port: 3004 });
    console.log("Logs service is running on http://localhost:3004");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
