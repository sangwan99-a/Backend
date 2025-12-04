import Fastify from 'fastify';
import { Kafka } from 'kafkajs';
import fastifySwagger from '@fastify/swagger';
import fastifyJwt from '@fastify/jwt';
import axios from 'axios';

const fastify = Fastify({ logger: true });

// Kafka setup
const kafka = new Kafka({
  clientId: 'jira-service',
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'jira-service-group' });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Jira Plugin Service API',
      description: 'API documentation for the Jira Plugin Service',
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
fastify.post('/jira/issues', async (request, reply) => {
  // Logic to create Jira issues
});

fastify.get('/jira/issues/:issueId', async (request, reply) => {
  // Logic to fetch Jira issue details
});

fastify.put('/jira/issues/:issueId', async (request, reply) => {
  // Logic to update Jira issues
});

fastify.post('/jira/webhooks', async (request, reply) => {
  // Logic to handle incoming Jira webhooks
});

// Jira API integration
const createJiraIssue = async (projectKey: string, summary: string, description: string) => {
  const response = await axios.post(`${process.env.JIRA_BASE_URL}/rest/api/3/issue`, {
    fields: {
      project: { key: projectKey },
      summary,
      description,
      issuetype: { name: 'Task' },
    },
  }, {
    headers: {
      Authorization: `Bearer ${process.env.JIRA_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: 'jira-events',
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'jira-events', fromBeginning: true });
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
    await fastify.listen({ port: 3011, host: '0.0.0.0' });
    console.log('Jira Plugin service is running on port 3011');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();