import Fastify from "fastify";

const server = Fastify();

server.get("/", async (request, reply) => {
  return { message: "File Management service is running" };
});

const start = async () => {
  try {
    await server.listen({ port: 3004 });
    console.log("File Management service is running on http://localhost:3004");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
