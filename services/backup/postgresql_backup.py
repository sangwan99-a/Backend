import os
import subprocess
from datetime import datetime

# Configuration
DB_NAME = "your_database"
DB_USER = "your_user"
DB_HOST = "localhost"
BACKUP_DIR = "e:/FusionDesk/backups/postgresql"
RETENTION_DAYS = 7

# Ensure backup directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

# Generate backup file name
backup_file = os.path.join(
    BACKUP_DIR, f"{DB_NAME}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.sql"
)

# Perform the backup
try:
    subprocess.run(
        [
            "pg_dump",
            f"--dbname=postgresql://{DB_USER}@{DB_HOST}/{DB_NAME}",
            f"--file={backup_file}"
        ],
        check=True
    )
    print(f"Backup successful: {backup_file}")
except subprocess.CalledProcessError as e:
    print(f"Backup failed: {e}")

# Retention policy: Delete old backups
now = datetime.now()
for file in os.listdir(BACKUP_DIR):
    file_path = os.path.join(BACKUP_DIR, file)
    if os.path.isfile(file_path):
        file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
        if (now - file_time).days > RETENTION_DAYS:
            os.remove(file_path)
            print(f"Deleted old backup: {file_path}")