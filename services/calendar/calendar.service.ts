import Fastify from 'fastify';
import { Kafka } from 'kafkajs';
import fastifySwagger from '@fastify/swagger';
import fastifyJwt from '@fastify/jwt';
import axios from 'axios';

const fastify = Fastify({ logger: true });

// Kafka setup
const kafka = new Kafka({
  clientId: 'calendar-service',
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'calendar-service-group' });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Calendar Service API',
      description: 'API documentation for the Calendar Service',
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
  // Logic to fetch calendar events
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
    await fastify.listen({ port: 3004, host: '0.0.0.0' });
    console.log('Calendar service is running on port 3004');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();