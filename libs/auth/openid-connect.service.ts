import { FastifyInstance } from 'fastify';

export const openIDConnectRoutes = async (server: FastifyInstance) => {
  server.post('/token', async (request, reply) => {
    const { client_id, client_secret, grant_type } = request.body as {
      client_id: string;
      client_secret: string;
      grant_type: string;
    };

    // Validate client_id and client_secret
    if (client_id !== 'your-client-id' || client_secret !== 'your-client-secret') {
      return reply.status(401).send({ error: 'Invalid client credentials' });
    }

    // Issue token
    const token = {
      access_token: 'your-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    return reply.send(token);
  });
};