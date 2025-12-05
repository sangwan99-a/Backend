import Fastify from "fastify";
import { Kafka } from "kafkajs";
import fastifySwagger from "@fastify/swagger";
import fastifyJwt from "@fastify/jwt";
import axios from "axios";

const fastify = Fastify({ logger: true });

// Kafka setup
const kafka = new Kafka({
  clientId: "crm-service",
  brokers: (process.env.KAFKA_BROKERS || "").split(","),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "crm-service-group" });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "supersecret",
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: "/documentation",
  swagger: {
    info: {
      title: "CRM Plugin Service API",
      description: "API documentation for the CRM Plugin Service",
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
fastify.post("/crm/contacts", async (request, reply) => {
  // Logic to create CRM contacts
});

fastify.get("/crm/contacts/:contactId", async (request, reply) => {
  // Logic to fetch CRM contact details
});

fastify.put("/crm/contacts/:contactId", async (request, reply) => {
  // Logic to update CRM contacts
});

fastify.delete("/crm/contacts/:contactId", async (request, reply) => {
  // Logic to delete CRM contacts
});

// CRM API integration
const createCRMContact = async (provider: string, contactData: any) => {
  let url = "";
  let headers = {};

  if (provider === "salesforce") {
    url = `${process.env.SALESFORCE_BASE_URL}/services/data/vXX.X/sobjects/Contact`;
    headers = {
      Authorization: `Bearer ${process.env.SALESFORCE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };
  } else if (provider === "hubspot") {
    url = `https://api.hubapi.com/contacts/v1/contact`; // Example HubSpot endpoint
    headers = {
      Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
      "Content-Type": "application/json",
    };
  }

  const response = await axios.post(url, contactData, { headers });
  return response.data;
};

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: "crm-events",
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "crm-events", fromBeginning: true });
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
    await fastify.listen({ port: 3012, host: "0.0.0.0" });
    console.log("CRM Plugin service is running on port 3012");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
