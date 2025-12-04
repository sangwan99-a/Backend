import os
import shutil
from datetime import datetime

# Configuration
OBJECT_STORAGE_DIR = "e:/FusionDesk/storage"  # Adjust to your object storage directory
BACKUP_DIR = "e:/FusionDesk/backups/object_storage"
RETENTION_DAYS = 7

# Ensure backup directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

# Generate backup folder name
backup_folder = os.path.join(
    BACKUP_DIR, f"object_storage_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}"
)

# Perform the backup
try:
    shutil.copytree(OBJECT_STORAGE_DIR, backup_folder)
    print(f"Backup successful: {backup_folder}")
except Exception as e:
    print(f"Backup failed: {e}")

# Retention policy: Delete old backups
now = datetime.now()
for folder in os.listdir(BACKUP_DIR):
    folder_path = os.path.join(BACKUP_DIR, folder)
    if os.path.isdir(folder_path):
        folder_time = datetime.fromtimestamp(os.path.getmtime(folder_path))
        if (now - folder_time).days > RETENTION_DAYS:
            shutil.rmtree(folder_path)
            print(f"Deleted old backup: {folder_path}")