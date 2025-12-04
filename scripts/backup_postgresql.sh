#!/bin/bash

# Variables
BACKUP_DIR="/backups/postgresql"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="fusiondesk"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform the backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE

# Verify the backup
if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"
else
    echo "Backup failed"
    exit 1
fi

# Optional: Remove backups older than 7 days
find $BACKUP_DIR -type f -name "$DB_NAME-*.sql" -mtime +7 -exec rm {} \;