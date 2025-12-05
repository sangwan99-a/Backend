import { FastifyInstance } from "fastify";

export const jiraRoutes = async (server: FastifyInstance) => {
  server.post("/create-issue", async (request, reply) => {
    const { projectKey, summary, description } = request.body as {
      projectKey: string;
      summary: string;
      description: string;
    };
    // Logic to create a Jira issue
    return { status: "success", projectKey, summary };
  });

  server.get("/projects", async (request, reply) => {
    // Logic to fetch Jira projects
    return [
      { id: "P01", name: "Project A" },
      { id: "P02", name: "Project B" },
    ];
  });
};
