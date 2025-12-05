import Fastify from "fastify";
import { Kafka } from "kafkajs";
import { Pool } from "pg";
import Redis from "ioredis";
import fastifySwagger from "@fastify/swagger";
import fastifyJwt from "@fastify/jwt";
import crypto from "crypto";
import ActiveDirectory from "activedirectory";
import fastifyOauth2 from "@fastify/oauth2";
import fs from "fs";
import path from "path";
import multer from "fastify-multer";
import { exec } from "child_process";
import fastifyRateLimit from "@fastify/rate-limit";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { Request, Response, NextFunction } from "express";

const fastify = Fastify({ logger: true });

// PostgreSQL setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

// Redis setup
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
});

// Kafka setup
const kafka = new Kafka({
  clientId: "email-service",
  brokers: (process.env.KAFKA_BROKERS || "").split(","),
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "email-service-group" });

// JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "supersecret",
});

// Swagger setup
fastify.register(fastifySwagger, {
  swagger: {
    info: {
      title: "Email Service API",
      description: "API documentation for the Email Service",
      version: "1.0.0",
    },
  },
  exposeRoute: true,
});

// Middleware to verify JWT
fastify.addHook("onRequest", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Middleware to authenticate users via Active Directory
fastify.addHook("onRequest", async (request, reply) => {
  const { username, password } = request.headers;

  if (!username || !password) {
    reply.code(401).send({ error: "Missing credentials" });
    return;
  }

  ad.authenticate(username, password, (err: Error | null, auth: boolean) => {
    if (err) {
      reply
        .code(500)
        .send({ error: "Authentication error", details: err.message });
      return;
    }

    if (!auth) {
      reply.code(401).send({ error: "Invalid credentials" });
      return;
    }

    // Proceed if authentication is successful
    request.user = { username };
  });
});

// Active Directory configuration
const adConfig = {
  url: process.env.AD_URL || "ldap://your-ad-server",
  baseDN: process.env.AD_BASE_DN || "dc=example,dc=com",
  username: process.env.AD_USERNAME || "admin@example.com",
  password: process.env.AD_PASSWORD || "password",
};

const ad = new ActiveDirectory(adConfig);

// Encryption utility functions
const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32); // Replace with a securely stored key
const iv = crypto.randomBytes(16);

function encryptData(data: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decryptData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(":");
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(ivHex, "hex"),
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// OAuth 2.0 configuration
fastify.register(fastifyOauth2, {
  name: "oauth2",
  scope: ["openid", "profile", "email"],
  credentials: {
    client: {
      id: process.env.OAUTH_CLIENT_ID || "your-client-id",
      secret: process.env.OAUTH_CLIENT_SECRET || "your-client-secret",
    },
    auth: {
      tokenHost:
        process.env.OAUTH_TOKEN_HOST || "https://your-identity-provider.com",
      authorizePath: process.env.OAUTH_AUTHORIZE_PATH || "/oauth/authorize",
      tokenPath: process.env.OAUTH_TOKEN_PATH || "/oauth/token",
    },
  },
  startRedirectPath: "/login",
  callbackUri:
    process.env.OAUTH_CALLBACK_URI || "http://localhost:3010/callback",
});

// Middleware to validate JWT tokens
fastify.addHook("onRequest", async (request, reply) => {
  try {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      reply.code(401).send({ error: "Missing token" });
      return;
    }

    const userInfo = await fastify.oauth2?.getUserInfo(token);
    request.user = userInfo;
  } catch (err) {
    reply
      .code(401)
      .send({ error: "Invalid token", details: (err as Error).message });
  }
});

// Example endpoint to fetch user profile
fastify.get("/profile", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  reply.send({ user: request.user });
});

// RESTful API endpoints
fastify.post("/emails/send", async (request, reply) => {
  const { recipient, subject, body } = request.body as {
    recipient: string;
    subject: string;
    body: string;
  };

  // Encrypt email content before processing
  const encryptedBody = encryptData(body);

  // Log the email sending action
  logAuditEntry({
    event: "send-email",
    user: (request.user as { username: string })?.username || "anonymous",
    recipient,
    subject,
  });

  // Logic to send emails
  reply.send({ status: "Email sent" });
});

fastify.get("/emails", async (request, reply) => {
  // Logic to fetch emails with filters
});

fastify.put("/emails/:emailId", async (request, reply) => {
  // Logic to update email status or labels
});

fastify.delete("/emails/:emailId", async (request, reply) => {
  // Logic to delete emails
});

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
});

// Middleware for malware scanning
function scanFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`clamscan ${filePath}`, (error, stdout) => {
      if (error || !stdout.includes("OK")) {
        reject(new Error("Malware detected or scan failed"));
      } else {
        resolve();
      }
    });
  });
}

// Endpoint for file uploads with malware scanning
fastify.post(
  "/upload",
  { preHandler: upload.single("file") },
  async (request, reply) => {
    const file = request.file;

    if (!file) {
      reply.code(400).send({ error: "No file uploaded" });
      return;
    }

    try {
      await scanFile(file.path);
      reply.send({
        status: "File uploaded successfully",
        file: file.originalname,
      });
    } catch (err) {
      reply
        .code(400)
        .send({ error: "File upload failed", details: (err as Error).message });
    }
  },
);

// Kafka event publishing
const publishEvent = async (event: any) => {
  await producer.send({
    topic: "email-events",
    messages: [{ value: JSON.stringify(event) }],
  });
};

// Kafka event consumption
const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "email-events", fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value?.toString() || "{}");
      // Handle consumed events
    },
  });
};

// Audit logging utility
const auditLogPath = path.join(__dirname, "audit.log");

function logAuditEntry(entry: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, ...entry };
  fs.appendFileSync(auditLogPath, JSON.stringify(logEntry) + "\n");
}

// Middleware to log user actions
fastify.addHook("onRequest", async (request, reply) => {
  const { method, url, headers } = request;
  const user = request.user || { username: "anonymous" };

  logAuditEntry({
    event: "request",
    user: user.username,
    method,
    url,
    headers,
  });
});

// Rate limiting configuration
fastify.register(fastifyRateLimit, {
  max: 100, // Maximum number of requests per minute
  timeWindow: "1 minute",
});

// Middleware for IP whitelisting
const allowedIPs = ["192.168.1.1", "203.0.113.0"]; // Replace with your allowed IPs
fastify.addHook("onRequest", async (request, reply) => {
  const clientIP = request.ip;
  if (!allowedIPs.includes(clientIP)) {
    reply.code(403).send({ error: "Access denied" });
    return;
  }
});

// Example endpoint to demonstrate protection
fastify.get("/protected", async (request, reply) => {
  reply.send({ message: "This is a protected route" });
});

// Endpoint to generate MFA secret and QR code
fastify.get("/mfa/setup", async (request, reply) => {
  const secret = speakeasy.generateSecret({ length: 20 });

  const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url || "");

  reply.send({
    secret: secret.base32,
    qrCode: qrCodeDataURL,
  });
});

// Endpoint to verify MFA token
fastify.post("/mfa/verify", async (request, reply) => {
  const { token, secret } = request.body as { token: string; secret: string };

  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  });

  if (verified) {
    reply.send({ status: "MFA verified successfully" });
  } else {
    reply.code(400).send({ error: "Invalid MFA token" });
  }
});

// GDPR and HIPAA compliance utilities

// Data retention policy enforcement
function enforceDataRetentionPolicy() {
  // Example: Automatically delete data older than 30 days
  setInterval(
    async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Replace with actual database query to delete old data
      console.log(`Deleting data older than: ${thirtyDaysAgo.toISOString()}`);
      // await database.deleteOldData(thirtyDaysAgo);
    },
    24 * 60 * 60 * 1000,
  ); // Run daily
}

enforceDataRetentionPolicy();

// Example endpoint to handle data access requests
fastify.get("/data-access", async (request, reply) => {
  const userId = request.user?.id;

  if (!userId) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  // Replace with actual database query to fetch user data
  const userData = {
    id: userId,
    name: "John Doe",
    email: "john.doe@example.com",
  };

  reply.send({ userData });
});

// Example endpoint to handle data deletion requests
fastify.delete("/data-deletion", async (request, reply) => {
  const userId = request.user?.id;

  if (!userId) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  // Replace with actual database query to delete user data
  console.log(`Deleting data for user: ${userId}`);
  // await database.deleteUserData(userId);

  reply.send({ status: "User data deleted successfully" });
});

// Middleware to extract tenant context from headers
function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const tenantId = req.headers["x-tenant-id"];
  if (!tenantId) {
    return res.status(400).json({ error: "Tenant ID is required" });
  }

  // Set tenant ID in request context
  req["tenantId"] = tenantId;
  next();
}

// Apply middleware to all routes
app.use(tenantContextMiddleware);

// Start the service
const start = async () => {
  try {
    await producer.connect();
    await consumeEvents();
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Email service is running on port 3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
