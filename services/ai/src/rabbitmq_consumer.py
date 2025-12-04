import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='ai-tasks')

def callback(ch, method, properties, body):
    print(f"Received RabbitMQ message: {body}")
    # Process the message here

channel.basic_consume(queue='ai-tasks', on_message_callback=callback, auto_ack=True)

print('AI Service RabbitMQ Consumer is running...')
channel.start_consuming()