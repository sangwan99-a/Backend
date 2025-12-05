import Fastify from "fastify";

const server = Fastify();

server.get("/", async (request, reply) => {
  return { message: "Email service is running" };
});

const start = async () => {
  try {
    await server.listen({ port: 3002 });
    console.log("Email service is running on http://localhost:3002");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
