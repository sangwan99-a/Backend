#!/bin/bash

# Redis Backup Script
# This script creates a backup of the Redis database and stores it in a specified directory.

# Variables
BACKUP_DIR="/backups/redis"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/redis-backup-$TIMESTAMP.rdb"
REDIS_CLI="redis-cli"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Ensure the backup directory exists
mkdir -p "$BACKUP_DIR"

# Trigger Redis to save the database to disk
$REDIS_CLI -h $REDIS_HOST -p $REDIS_PORT SAVE

# Copy the dump.rdb file to the backup directory
cp /data/dump.rdb "$BACKUP_FILE"

# Remove backups older than 7 days
find "$BACKUP_DIR" -type f -name "redis-backup-*.rdb" -mtime +7 -exec rm {} \;

# Print success message
echo "Redis backup completed: $BACKUP_FILE"