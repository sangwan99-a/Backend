import Fastify from "fastify";
import { Kafka } from "kafkajs";
import { Pool } from "pg";
import Redis from "ioredis";
import fastifySwagger from "@fastify/swagger";
import fastifyJwt from "@fastify/jwt";
import AWS from "aws-sdk";

const fastify = Fastify({ logger: true });

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
  clientId: "file-management-service",
  brokers: (process.env.KAFKA_BROKERS || "").split(","),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "file-management-service-group" });

// AWS S3 setup
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
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
      title: "File Management Service API",
      description: "API documentation for the File Management Service",
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
fastify.post("/files/upload", async (request, reply) => {
  // Logic to upload files to S3
});

fastify.get("/files/:fileId", async (request, reply) => {
  // Logic to download files from S3
});

fastify.delete("/files/:fileId", async (request, reply) => {
  // Logic to delete files from S3
});

fastify.put("/files/:fileId", async (request, reply) => {
  // Logic to update file metadata
});

fastify.get("/files/search", async (request, reply) => {
  // Logic to search files by metadata
});

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: "file-events",
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "file-events", fromBeginning: true });
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
    await fastify.listen({ port: 3002, host: "0.0.0.0" });
    console.log("File Management service is running on port 3002");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
