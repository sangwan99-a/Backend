#!/bin/bash

# MinIO Backup Script
# This script creates a backup of MinIO buckets and stores it in a specified directory.

# Variables
BACKUP_DIR="/backups/minio"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/minio-backup-$TIMESTAMP.tar.gz"
MINIO_HOST="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
BUCKET_NAME="my-bucket"

# Ensure the backup directory exists
mkdir -p "$BACKUP_DIR"

# Export MinIO bucket data
mc alias set local $MINIO_HOST $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
mc cp --recursive local/$BUCKET_NAME /tmp/$BUCKET_NAME

# Compress the bucket data
cd /tmp && tar -czf "$BACKUP_FILE" "$BUCKET_NAME"

# Remove temporary bucket data
rm -rf /tmp/$BUCKET_NAME

# Remove backups older than 7 days
find "$BACKUP_DIR" -type f -name "minio-backup-*.tar.gz" -mtime +7 -exec rm {} \;

# Print success message
echo "MinIO backup completed: $BACKUP_FILE"