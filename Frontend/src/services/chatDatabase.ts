import Dexie, { Table } from 'dexie';
import { Message, UnsentMessage, Channel } from '@/types/chat';

export class ChatDatabase extends Dexie {
  messages!: Table<Message>;
  unsentMessages!: Table<UnsentMessage>;
  channels!: Table<Channel>;

  constructor() {
    super('FusionDeskChat');
    this.version(1).stores({
      messages: '++id, channelId, timestamp',
      unsentMessages: '++tempId, channelId, createdAt',
      channels: '++id, name',
    });
  }
}

export const chatDB = new ChatDatabase();

export const chatDatabaseService = {
  // Message operations
  async saveMessage(message: Message) {
    return chatDB.messages.add(message);
  },

  async getMessages(channelId: string, limit = 50, before?: string) {
    if (before) {
      return chatDB.messages
        .where('channelId')
        .equals(channelId)
        .filter((m) => new Date(m.timestamp) < new Date(before))
        .reverse()
        .limit(limit)
        .toArray();
    }
    return chatDB.messages
      .where('channelId')
      .equals(channelId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getMessage(id: string) {
    return chatDB.messages.get(id);
  },

  async updateMessage(id: string, updates: Partial<Message>) {
    return chatDB.messages.update(id, updates);
  },

  async deleteMessage(id: string) {
    return chatDB.messages.delete(id);
  },

  async clearMessages(channelId: string) {
    return chatDB.messages.where('channelId').equals(channelId).delete();
  },

  // Unsent message operations
  async saveUnsentMessage(message: UnsentMessage) {
    return chatDB.unsentMessages.add(message);
  },

  async getUnsentMessages(channelId?: string) {
    if (channelId) {
      return chatDB.unsentMessages
        .where('channelId')
        .equals(channelId)
        .toArray();
    }
    return chatDB.unsentMessages.toArray();
  },

  async deleteUnsentMessage(tempId: string) {
    return chatDB.unsentMessages.delete(tempId);
  },

  async updateUnsentMessage(tempId: string, updates: Partial<UnsentMessage>) {
    return chatDB.unsentMessages.update(tempId, updates);
  },

  // Channel operations
  async saveChannel(channel: Channel) {
    return chatDB.channels.put(channel);
  },

  async getChannels() {
    return chatDB.channels.toArray();
  },

  async getChannel(id: string) {
    return chatDB.channels.get(id);
  },

  async updateChannel(id: string, updates: Partial<Channel>) {
    return chatDB.channels.update(id, updates);
  },

  async deleteChannel(id: string) {
    return chatDB.channels.delete(id);
  },

  async clearAllData() {
    await chatDB.messages.clear();
    await chatDB.unsentMessages.clear();
    await chatDB.channels.clear();
  },
};
