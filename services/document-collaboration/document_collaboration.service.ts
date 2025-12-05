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
  clientId: "document-collaboration-service",
  brokers: (process.env.KAFKA_BROKERS || "").split(","),
});
const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: "document-collaboration-service-group",
});

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
      title: "Document Collaboration Service API",
      description: "API documentation for the Document Collaboration Service",
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
fastify.post("/documents/upload", async (request, reply) => {
  // Logic to upload documents to S3
});

fastify.get("/documents/:documentId", async (request, reply) => {
  // Logic to download documents from S3
});

fastify.put("/documents/:documentId", async (request, reply) => {
  // Logic to update document metadata
});

fastify.delete("/documents/:documentId", async (request, reply) => {
  // Logic to delete documents from S3
});

fastify.post("/documents/share", async (request, reply) => {
  // Logic to share documents and manage permissions
});

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: "document-events",
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "document-events", fromBeginning: true });
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
    await fastify.listen({ port: 3016, host: "0.0.0.0" });
    console.log("Document Collaboration service is running on port 3016");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
