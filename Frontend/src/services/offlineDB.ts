import type Dexie from 'dexie';

export class OfflineDB {
  private db: any;

  constructor() {
    // Will be initialized in component
  }

  async initDB() {
    // Initialize IndexedDB for offline storage
    const Dexie = (await import('dexie')).default;
    this.db = new Dexie('AIProductivityDB');

    this.db.version(1).stores({
      conversations: '++id, userId',
      messages: '++id, conversationId',
      tasks: '++id, userId',
      emails: '++id, userId',
      documents: '++id, userId',
      syncQueue: '++id, timestamp',
    });
  }

  async saveMessages(conversationId: string, messages: any[]) {
    await this.db.messages.bulkPut(
      messages.map((msg: any) => ({ ...msg, conversationId }))
    );
  }

  async getMessages(conversationId: string) {
    return await this.db.messages.where('conversationId').equals(conversationId).toArray();
  }

  async saveTasks(tasks: any[]) {
    await this.db.tasks.bulkPut(tasks);
  }

  async getTasks() {
    return await this.db.tasks.toArray();
  }

  async addToSyncQueue(action: string, resource: string, resourceId: string, payload: any) {
    await this.db.syncQueue.add({
      action,
      resource,
      resourceId,
      payload,
      timestamp: new Date(),
      retryCount: 0,
    });
  }

  async getSyncQueue() {
    return await this.db.syncQueue.toArray();
  }

  async removeSyncQueueItem(id: number) {
    await this.db.syncQueue.delete(id);
  }

  async clearAll() {
    await this.db.conversations.clear();
    await this.db.messages.clear();
    await this.db.tasks.clear();
    await this.db.emails.clear();
    await this.db.documents.clear();
  }
}

export const offlineDB = new OfflineDB();
