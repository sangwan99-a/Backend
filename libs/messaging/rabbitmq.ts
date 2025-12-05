import amqp from "amqplib";

let channel: amqp.Channel;

export const initializeRabbitMQ = async () => {
  const connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel();
  console.log("RabbitMQ channel connected");
};

export const getRabbitMQChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  return channel;
};
