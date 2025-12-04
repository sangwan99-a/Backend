import Fastify from 'fastify';
import { Kafka } from 'kafkajs';
import { Pool } from 'pg';
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

// Kafka setup
const kafka = new Kafka({
  clientId: 'monitoring-analytics-service',
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
});
const consumer = kafka.consumer({ groupId: 'monitoring-analytics-group' });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Monitoring and Analytics Service API',
      description: 'API documentation for the Monitoring and Analytics Service',
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
fastify.get('/metrics/system-health', async (request, reply) => {
  // Logic to fetch system health metrics
  reply.send({ status: 'System health metrics' });
});

fastify.get('/metrics/user-activity', async (request, reply) => {
  // Logic to fetch user activity dashboards
  reply.send({ status: 'User activity metrics' });
});

fastify.get('/insights/productivity', async (request, reply) => {
  // Logic to fetch productivity insights
  reply.send({ status: 'Productivity insights' });
});

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'service-events', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value?.toString() || '{}');
      // Normalize and store events in PostgreSQL
      console.log('Received event:', event);
    },
  });
};

// Start the service
const start = async () => {
  try {
    await consumeEvents();
    await fastify.listen({ port: 3020, host: '0.0.0.0' });
    console.log('Monitoring and Analytics service is running on port 3020');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();