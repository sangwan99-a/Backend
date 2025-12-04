import os
import shutil
from datetime import datetime

# Configuration
REDIS_DIR = "C:/ProgramData/Redis"  # Adjust to your Redis data directory
BACKUP_DIR = "e:/FusionDesk/backups/redis"
RETENTION_DAYS = 7

# Ensure backup directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

# Generate backup file name
backup_file = os.path.join(
    BACKUP_DIR, f"redis_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.rdb"
)

# Perform the backup
try:
    redis_data_file = os.path.join(REDIS_DIR, "dump.rdb")
    if os.path.exists(redis_data_file):
        shutil.copy2(redis_data_file, backup_file)
        print(f"Backup successful: {backup_file}")
    else:
        print("Redis dump.rdb file not found. Ensure Redis persistence is enabled.")
except Exception as e:
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