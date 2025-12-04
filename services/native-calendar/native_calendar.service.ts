import Fastify from 'fastify';
import { Kafka } from 'kafkajs';
import { Pool } from 'pg';
import Redis from 'ioredis';
import fastifySwagger from '@fastify/swagger';
import fastifyJwt from '@fastify/jwt';

const fastify = Fastify({ logger: true });

// PostgreSQL setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Redis setup
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

// Kafka setup
const kafka = new Kafka({
  clientId: 'native-calendar-service',
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'native-calendar-service-group' });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Native Calendar Service API',
      description: 'API documentation for the Native Calendar Service',
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
fastify.post('/events', async (request, reply) => {
  // Logic to create calendar events
});

fastify.get('/events', async (request, reply) => {
  // Logic to retrieve calendar events
});

fastify.put('/events/:eventId', async (request, reply) => {
  // Logic to update calendar events
});

fastify.delete('/events/:eventId', async (request, reply) => {
  // Logic to delete calendar events
});

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: 'calendar-events',
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'calendar-events', fromBeginning: true });
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
    await fastify.listen({ port: 3013, host: '0.0.0.0' });
    console.log('Native Calendar service is running on port 3013');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();