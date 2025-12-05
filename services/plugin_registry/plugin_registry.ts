import Fastify from "fastify";

const fastify = Fastify({ logger: true });

// Plugin catalog
const plugins: Record<string, any> = {};

// AI-powered recommendation engine
const pluginRecommendations: Record<string, string[]> = {
  tenant1: ["pluginA", "pluginB"],
  tenant2: ["pluginC", "pluginD"],
};

// Plugin monetization
const pluginMonetization: Record<
  string,
  { price: number; revenueShare: number }
> = {
  pluginA: { price: 10, revenueShare: 0.8 },
  pluginB: { price: 20, revenueShare: 0.7 },
};

// Define types for request bodies and parameters
interface SubmitPluginBody {
  name: string;
  version: string;
  description: string;
  developer: string;
  code: string;
}

interface UpdatePluginBody {
  version: string;
  description: string;
  code: string;
}

interface AddChangelogBody {
  version: string;
  changelog: string;
}

interface ParamsWithName {
  name: string;
}

interface ParamsWithTenantId {
  tenantId: string;
}

// API to submit a plugin
fastify.post<{ Body: SubmitPluginBody }>("/plugins", async (request, reply) => {
  const { name, version, description, developer, code } = request.body;

  if (plugins[name]) {
    return reply.status(409).send({ error: "Plugin already exists" });
  }

  // Validate and catalog the plugin
  plugins[name] = {
    version,
    description,
    developer,
    code,
    createdAt: new Date(),
  };
  reply.status(201).send({ message: "Plugin submitted successfully" });
});

// API to update a plugin
fastify.put<{ Params: ParamsWithName; Body: UpdatePluginBody }>(
  "/plugins/:name",
  async (request, reply) => {
    const { name } = request.params;
    const { version, description, code } = request.body;

    if (!plugins[name]) {
      return reply.status(404).send({ error: "Plugin not found" });
    }

    // Update plugin details
    plugins[name] = {
      ...plugins[name],
      version,
      description,
      code,
      updatedAt: new Date(),
    };
    reply.status(200).send({ message: "Plugin updated successfully" });
  },
);

// API to list plugins
fastify.get("/plugins", async (request, reply) => {
  reply.send(Object.keys(plugins).map((name) => ({ name, ...plugins[name] })));
});

// API to get plugin details
fastify.get("/plugins/:name", async (request, reply) => {
  const { name } = request.params;

  if (!plugins[name]) {
    return reply.status(404).send({ error: "Plugin not found" });
  }

  reply.send(plugins[name]);
});

// API to manage plugin changelogs
fastify.post<{ Params: ParamsWithName; Body: AddChangelogBody }>(
  "/plugins/:name/changelog",
  async (request, reply) => {
    const { name } = request.params;
    const { version, changelog } = request.body;

    if (!plugins[name]) {
      return reply.status(404).send({ error: "Plugin not found" });
    }

    if (!plugins[name].changelogs) {
      plugins[name].changelogs = [];
    }

    plugins[name].changelogs.push({ version, changelog, date: new Date() });
    reply.status(201).send({ message: "Changelog added successfully" });
  },
);

// API to retrieve plugin changelogs
fastify.get("/plugins/:name/changelog", async (request, reply) => {
  const { name } = request.params;

  if (!plugins[name]) {
    return reply.status(404).send({ error: "Plugin not found" });
  }

  reply.send(plugins[name].changelogs || []);
});

// API to install a plugin for a tenant
fastify.post(
  "/tenants/:tenantId/plugins/:name/install",
  async (request, reply) => {
    const { tenantId, name } = request.params;

    if (!plugins[name]) {
      return reply.status(404).send({ error: "Plugin not found" });
    }

    // Simulate plugin installation
    reply
      .status(200)
      .send({ message: `Plugin '${name}' installed for tenant '${tenantId}'` });
  },
);

// API to list installed plugins for a tenant
fastify.get("/tenants/:tenantId/plugins", async (request, reply) => {
  const { tenantId } = request.params;

  // Simulate fetching installed plugins
  reply.send({ tenantId, installedPlugins: ["example-plugin"] });
});

// API to enable or disable a plugin for a tenant
fastify.patch("/tenants/:tenantId/plugins/:name", async (request, reply) => {
  const { tenantId, name } = request.params;
  const { enabled } = request.body;

  if (!plugins[name]) {
    return reply.status(404).send({ error: "Plugin not found" });
  }

  // Simulate enabling/disabling the plugin
  reply
    .status(200)
    .send({
      message: `Plugin '${name}' ${enabled ? "enabled" : "disabled"} for tenant '${tenantId}'`,
    });
});

// API to check for plugin updates
fastify.get("/plugins/:name/updates", async (request, reply) => {
  const { name } = request.params;

  if (!plugins[name]) {
    return reply.status(404).send({ error: "Plugin not found" });
  }

  // Simulate checking for updates
  reply.send({ name, latestVersion: plugins[name].version });
});

// API to fetch recommended plugins for a tenant
fastify.get("/tenants/:tenantId/recommendations", async (request, reply) => {
  const { tenantId } = request.params;

  const recommendations = pluginRecommendations[tenantId] || [];
  reply.send({ tenantId, recommendations });
});

// API to fetch plugin pricing details
fastify.get("/plugins/:name/pricing", async (request, reply) => {
  const { name } = request.params;

  if (!pluginMonetization[name]) {
    return reply.status(404).send({ error: "Plugin not found" });
  }

  reply.send(pluginMonetization[name]);
});

// Start the server
fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
