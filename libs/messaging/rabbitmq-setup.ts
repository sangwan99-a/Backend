import amqp from "amqplib";

let channel: amqp.Channel;

export const initializeRabbitMQ = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    console.log("RabbitMQ channel connected");
  } catch (error) {
    console.error("Error initializing RabbitMQ:", error);
  }
};

export const getRabbitMQChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  return channel;
};
