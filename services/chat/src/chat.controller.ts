import { FastifyInstance } from 'fastify';

export const chatRoutes = async (server: FastifyInstance) => {
  server.get('/messages', async (request, reply) => {
    // Fetch messages logic here
    return [{ id: '1', content: 'Hello World', timestamp: new Date().toISOString() }];
  });

  server.post('/messages', async (request, reply) => {
    const { content } = request.body as { content: string };
    // Save message logic here
    return { id: '2', content, timestamp: new Date().toISOString() };
  });
};