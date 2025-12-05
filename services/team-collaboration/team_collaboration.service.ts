import Fastify from "fastify";
import { Kafka } from "kafkajs";
import { Pool } from "pg";
import Redis from "ioredis";
import fastifySwagger from "@fastify/swagger";
import fastifyJwt from "@fastify/jwt";
import { Server } from "socket.io";
import { createServer } from "http";

const fastify = Fastify({ logger: true });
const httpServer = createServer(fastify.server);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// PostgreSQL setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

// Redis setup
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
});

// Kafka setup
const kafka = new Kafka({
  clientId: "team-collaboration-service",
  brokers: (process.env.KAFKA_BROKERS || "").split(","),
});
const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: "team-collaboration-service-group",
});

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "supersecret",
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: "/documentation",
  swagger: {
    info: {
      title: "Team Collaboration Service API",
      description: "API documentation for the Team Collaboration Service",
      version: "1.0.0",
    },
  },
  exposeRoute: true,
});

// Middleware to verify JWT
fastify.addHook("onRequest", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// RESTful API endpoints
fastify.post("/rooms", async (request, reply) => {
  // Logic to create chat rooms
});

fastify.get("/rooms/:roomId", async (request, reply) => {
  // Logic to fetch chat room details
});

fastify.post("/messages", async (request, reply) => {
  // Logic to send messages
});

fastify.get("/messages/:roomId", async (request, reply) => {
  // Logic to fetch messages for a room
});

// WebSocket events
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("message", (data) => {
    const { roomId, message } = data;
    io.to(roomId).emit("message", message);
    console.log(`Message sent to room ${roomId}:`, message);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: "team-collaboration-events",
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "team-collaboration-events",
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value?.toString() || "{}");
      // Handle consumed events
    },
  });
};

// Start the service
const start = async () => {
  try {
    await producer.connect();
    await consumeEvents();
    await httpServer.listen(
      parseInt(process.env.PORT || "3014", 10),
      "0.0.0.0",
    );
    console.log("Team Collaboration service is running on port 3014");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
