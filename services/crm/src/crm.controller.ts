import { FastifyInstance } from 'fastify';

export const crmRoutes = async (server: FastifyInstance) => {
  server.post('/add-contact', async (request, reply) => {
    const { name, email, phone } = request.body as {
      name: string;
      email: string;
      phone: string;
    };
    // Logic to add a contact to the CRM
    return { status: 'success', name, email };
  });

  server.get('/contacts', async (request, reply) => {
    // Logic to fetch CRM contacts
    return [
      { id: 'C01', name: 'John Doe', email: 'john@example.com' },
      { id: 'C02', name: 'Jane Smith', email: 'jane@example.com' },
    ];
  });
};