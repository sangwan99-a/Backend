import Fastify from "fastify";

const server = Fastify();

server.get("/", async (request, reply) => {
  return { message: "Chat service is running" };
});

const start = async () => {
  try {
    await server.listen({ port: 3002 });
    console.log("Chat service is running on http://localhost:3002");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
