import os
import subprocess
from datetime import datetime

# Configuration
BROKER_TYPE = "kafka"  # Change to "rabbitmq" for RabbitMQ backups
KAFKA_TOPICS = ["topic1", "topic2"]  # List of Kafka topics to back up
RABBITMQ_QUEUES = ["queue1", "queue2"]  # List of RabbitMQ queues to back up
BACKUP_DIR = "e:/FusionDesk/backups/messaging"
RETENTION_DAYS = 7

# Ensure backup directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

# Generate backup folder name
backup_folder = os.path.join(
    BACKUP_DIR, f"messaging_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}"
)
os.makedirs(backup_folder, exist_ok=True)

# Perform the backup
try:
    if BROKER_TYPE == "kafka":
        for topic in KAFKA_TOPICS:
            backup_file = os.path.join(backup_folder, f"{topic}.backup")
            subprocess.run(
                ["kafka-console-consumer", "--bootstrap-server", "localhost:9092", "--topic", topic, "--from-beginning"],
                stdout=open(backup_file, "w"),
                check=True
            )
            print(f"Kafka topic '{topic}' backed up successfully.")
    elif BROKER_TYPE == "rabbitmq":
        for queue in RABBITMQ_QUEUES:
            backup_file = os.path.join(backup_folder, f"{queue}.backup")
            subprocess.run(
                ["rabbitmqadmin", "get", f"queue={queue}", "requeue=false"],
                stdout=open(backup_file, "w"),
                check=True
            )
            print(f"RabbitMQ queue '{queue}' backed up successfully.")
    else:
        print("Unsupported broker type. Please set BROKER_TYPE to 'kafka' or 'rabbitmq'.")
except subprocess.CalledProcessError as e:
    print(f"Backup failed: {e}")

# Retention policy: Delete old backups
now = datetime.now()
for folder in os.listdir(BACKUP_DIR):
    folder_path = os.path.join(BACKUP_DIR, folder)
    if os.path.isdir(folder_path):
        folder_time = datetime.fromtimestamp(os.path.getmtime(folder_path))
        if (now - folder_time).days > RETENTION_DAYS:
            os.rmdir(folder_path)
            print(f"Deleted old backup: {folder_path}")