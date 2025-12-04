import Fastify from 'fastify';

const server = Fastify();

server.get('/', async (request, reply) => {
  return { message: 'File Management service is running' };
});

const start = async () => {
  try {
    await server.listen({ port: 3003 });
    console.log('File Management service is running on http://localhost:3003');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();