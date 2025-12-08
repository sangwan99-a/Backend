import Fastify from "fastify";

const server = Fastify();

server.get("/", async (request, reply) => {
  return { message: "Email service is running" };
});

const start = async () => {
  try {
    await server.listen({ port: 3003 });
    console.log("Email service is running on http://localhost:3003");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
