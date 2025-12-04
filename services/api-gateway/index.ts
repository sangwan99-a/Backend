import Fastify from 'fastify';

const server = Fastify();

server.get('/', async (request, reply) => {
  return { message: 'API Gateway is running' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log('API Gateway is running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();