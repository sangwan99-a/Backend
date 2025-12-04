import Fastify from 'fastify';
import { Kafka } from 'kafkajs';
import fastifySwagger from '@fastify/swagger';
import fastifyJwt from '@fastify/jwt';
import axios from 'axios';

const fastify = Fastify({ logger: true });

// Kafka setup
const kafka = new Kafka({
  clientId: 'slack-service',
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'slack-service-group' });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Swagger setup
fastify.register(fastifySwagger, {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Slack Plugin Service API',
      description: 'API documentation for the Slack Plugin Service',
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
fastify.post('/slack/send-message', async (request, reply) => {
  // Logic to send messages to Slack
});

fastify.post('/slack/events', async (request, reply) => {
  // Logic to handle incoming Slack events
});

// Slack API integration
const sendMessageToSlack = async (channel: string, text: string) => {
  const response = await axios.post('https://slack.com/api/chat.postMessage', {
    channel,
    text,
  }, {
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
  });
  return response.data;
};

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: 'slack-events',
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'slack-events', fromBeginning: true });
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
    await fastify.listen({ port: 3010, host: '0.0.0.0' });
    console.log('Slack Plugin service is running on port 3010');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();