import Fastify from "fastify";
import { chatRoutes } from "./chat.controller";

const server = Fastify();

server.register(chatRoutes, { prefix: "/chat" });

const start = async () => {
  try {
    await server.listen({ port: 3001 });
    console.log("Chat service is running on http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
