import Fastify from 'fastify';
import { Kafka } from 'kafkajs';
import { Client } from '@elastic/elasticsearch';
import fastifySwagger from '@fastify/swagger';
import fastifyJwt from '@fastify/jwt';

const fastify = Fastify({ logger: true });

// Elasticsearch setup
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
});

// Kafka setup
const kafka = new Kafka({
  clientId: 'logging-service',
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'logging-service-group' });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Logging Service API',
      description: 'API documentation for the Logging Service',
      version: '1.0.0',
    },
  },
  exposeRoute: true,
});

// Middleware to verify JWT
fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// RESTful API endpoints
fastify.post('/logs', async (request, reply) => {
  // Logic to ingest logs into Elasticsearch
});

fastify.get('/logs', async (request, reply) => {
  // Logic to query logs from Elasticsearch
});

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: 'log-events',
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'log-events', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value?.toString() || '{}');
      // Handle consumed events
    },
  });
};

// Start the service
const start = async () => {
  try {
    await producer.connect();
    await consumeEvents();
    await fastify.listen({ port: 3003, host: '0.0.0.0' });
    console.log('Logging service is running on port 3003');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();