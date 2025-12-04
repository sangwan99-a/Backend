import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'modular-backend',
  brokers: ['localhost:9092'],
});

export const kafkaProducer = kafka.producer();
export const kafkaConsumer = kafka.consumer({ groupId: 'modular-backend-group' });

export const initializeKafka = async () => {
  await kafkaProducer.connect();
  await kafkaConsumer.connect();
  console.log('Kafka producer and consumer connected');
};