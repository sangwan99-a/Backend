import Fastify from "fastify";
import Stripe from "stripe";

// Enable rawBody parsing for webhooks
const fastify = Fastify({ logger: true, bodyLimit: 1048576, rawBody: true });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

// Subscription plans
const plans = [
  {
    id: "basic",
    name: "Basic Plan",
    price: 1000,
    features: ["Feature A", "Feature B"],
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: 2000,
    features: ["Feature A", "Feature B", "Feature C"],
  },
];

// Usage metering and quota tracking
const usageRecords: Record<string, any[]> = {};

// Discounts and trials
const discounts: Record<string, { percentage: number; expiresAt: Date }> = {};

// Trials
const trials: Record<string, { durationDays: number }> = {
  basic: { durationDays: 14 },
  premium: { durationDays: 7 },
};

// Define types for request bodies and parameters
interface CreateSubscriptionBody {
  customerId: string;
  planId: string;
  paymentMethodId: string;
}

interface RecordUsageBody {
  customerId: string;
  feature: string;
  usage: number;
}

interface ParamsWithId {
  id: string;
}

interface ParamsWithCustomerId {
  customerId: string;
}

interface AddDiscountBody {
  code: string;
  percentage: number;
  expiresAt: string;
}

interface CreateInvoiceBody {
  customerId: string;
  amount: number;
  description: string;
}

// API to list subscription plans
fastify.get("/plans", async (request, reply) => {
  reply.send(plans);
});

// API to create a subscription
fastify.post<{ Body: CreateSubscriptionBody }>(
  "/subscriptions",
  async (request, reply) => {
    const { customerId, planId, paymentMethodId } = request.body;

    try {
      // Create a subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planId }],
        default_payment_method: paymentMethodId,
      });

      reply
        .status(201)
        .send({ message: "Subscription created successfully", subscription });
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  },
);

// API to cancel a subscription
fastify.delete<{ Params: ParamsWithId }>(
  "/subscriptions/:id",
  async (request, reply) => {
    const { id } = request.params;

    try {
      // Cancel the subscription in Stripe
      const cancellation = await stripe.subscriptions.del(id);
      reply
        .status(200)
        .send({ message: "Subscription cancelled successfully", cancellation });
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  },
);

// API to record usage
fastify.post<{ Body: RecordUsageBody }>("/usage", async (request, reply) => {
  const { customerId, feature, usage } = request.body;

  if (!usageRecords[customerId]) {
    usageRecords[customerId] = [];
  }

  usageRecords[customerId].push({ feature, usage, timestamp: new Date() });
  reply.status(200).send({ message: "Usage recorded successfully" });
});

// API to get usage records
fastify.get<{ Params: ParamsWithCustomerId }>(
  "/usage/:customerId",
  async (request, reply) => {
    const { customerId } = request.params;

    if (!usageRecords[customerId]) {
      return reply
        .status(404)
        .send({ error: "No usage records found for this customer" });
    }

    reply.send(usageRecords[customerId]);
  },
);

// API to generate an invoice
fastify.post<{ Body: CreateInvoiceBody }>(
  "/invoices",
  async (request, reply) => {
    const { customerId, amount, description } = request.body;

    try {
      // Create an invoice in Stripe
      const invoice = await stripe.invoices.create({
        customer: customerId,
        auto_advance: true, // Auto-finalize the invoice
        collection_method: "charge_automatically",
        description,
        lines: [
          {
            amount,
            currency: "usd",
            quantity: 1,
          },
        ],
      });

      reply
        .status(201)
        .send({ message: "Invoice generated successfully", invoice });
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  },
);

// API to add a discount
fastify.post<{ Body: AddDiscountBody }>(
  "/discounts",
  async (request, reply) => {
    const { code, percentage, expiresAt } = request.body;

    discounts[code] = { percentage, expiresAt: new Date(expiresAt) };
    reply.status(201).send({ message: "Discount added successfully" });
  },
);

// API to apply a discount during subscription creation
fastify.post<{ Body: CreateSubscriptionBody & { discountCode?: string } }>(
  "/subscriptions",
  async (request, reply) => {
    const { customerId, planId, paymentMethodId, discountCode } = request.body;

    try {
      let price = plans.find((plan) => plan.id === planId)?.price || 0;

      if (discountCode && discounts[discountCode]) {
        const discount = discounts[discountCode];
        if (new Date() < discount.expiresAt) {
          price = price - (price * discount.percentage) / 100;
        }
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planId }],
        default_payment_method: paymentMethodId,
        metadata: { discountCode },
      });

      reply
        .status(201)
        .send({ message: "Subscription created successfully", subscription });
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  },
);

// API to create a subscription with a trial
fastify.post<{ Body: CreateSubscriptionBody }>(
  "/subscriptions/trial",
  async (request, reply) => {
    const { customerId, planId, paymentMethodId } = request.body;

    try {
      const trialDays = trials[planId]?.durationDays || 0;

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planId }],
        default_payment_method: paymentMethodId,
        trial_period_days: trialDays,
      });

      reply
        .status(201)
        .send({
          message: "Trial subscription created successfully",
          subscription,
        });
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  },
);

// Webhook to handle Stripe events
fastify.post("/webhooks", async (request, reply) => {
  const sig = request.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );

    switch (event.type) {
      case "invoice.payment_succeeded":
        const invoice = event.data.object;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        console.log(`Payment failed for invoice ${failedInvoice.id}`);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    reply.status(200).send({ received: true });
  } catch (error: any) {
    console.error(`Webhook error: ${error.message}`);
    reply.status(400).send(`Webhook error: ${error.message}`);
  }
});

// Start the server
fastify.listen({ port: 3002 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
