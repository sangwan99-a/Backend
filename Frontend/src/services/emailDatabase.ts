/**
 * Email Database Service
 * IndexedDB-backed persistence for offline email support
 */

import Dexie, { Table } from 'dexie';
import { EmailMessage, EmailFolder, UnsentEmail, DraftEmail, EmailLabel } from '@/types/email';

export class EmailDatabase extends Dexie {
  messages!: Table<EmailMessage>;
  folders!: Table<EmailFolder>;
  labels!: Table<EmailLabel>;
  drafts!: Table<DraftEmail>;
  unsentEmails!: Table<UnsentEmail>;
  syncStatus!: Table<{ id: string; lastSync: Date; nextSync: Date; syncing: boolean }>;

  constructor() {
    super('FusionDeskEmailDB');
    this.version(1).stores({
      messages: '++id, threadId, folderId, timestamp, isRead, isStarred',
      folders: '++id, systemType',
      labels: '++id, name',
      drafts: '++id, createdAt, isSending',
      unsentEmails: '++id, draftId, createdAt, attemptCount',
      syncStatus: '++id',
    });
  }
}

export const emailDB = new EmailDatabase();

// ==================== Message Operations ====================

export async function saveMessage(message: EmailMessage): Promise<string> {
  return (await emailDB.messages.put(message)) as any as string;
}

export async function saveMessages(messages: EmailMessage[]): Promise<void> {
  await emailDB.messages.bulkPut(messages);
}

export async function getMessage(messageId: string): Promise<EmailMessage | undefined> {
  return await emailDB.messages.get(messageId);
}

export async function getMessagesByFolder(
  folderId: string,
  limit: number = 50,
  offset: number = 0
): Promise<EmailMessage[]> {
  return await emailDB.messages
    .where('folderId')
    .equals(folderId)
    .reverse()
    .sortBy('timestamp')
    .then((msgs) => msgs.slice(offset, offset + limit));
}

export async function getMessagesByThread(threadId: string): Promise<EmailMessage[]> {
  return await emailDB.messages
    .where('threadId')
    .equals(threadId)
    .toArray();
}

export async function getUnreadMessages(folderId?: string): Promise<EmailMessage[]> {
  let messages = await emailDB.messages.toCollection().toArray();
  let result = messages.filter((msg) => !msg.isRead);
  if (folderId) {
    result = result.filter((msg) => msg.folderId === folderId);
  }
  return result;
}

export async function getStarredMessages(folderId?: string): Promise<EmailMessage[]> {
  let messages = await emailDB.messages.toCollection().toArray();
  let result = messages.filter((msg) => msg.isStarred);
  if (folderId) {
    result = result.filter((msg) => msg.folderId === folderId);
  }
  return result;
}

export async function updateMessage(messageId: string, updates: Partial<EmailMessage>): Promise<void> {
  await emailDB.messages.update(messageId, updates);
}

export async function deleteMessage(messageId: string): Promise<void> {
  await emailDB.messages.delete(messageId);
}

export async function deleteMessagesByFolder(folderId: string): Promise<void> {
  await emailDB.messages.where('folderId').equals(folderId).delete();
}

export async function moveMessagesToFolder(
  messageIds: string[],
  folderId: string
): Promise<void> {
  const messages = await emailDB.messages.bulkGet(messageIds);
  const updated = messages
    .filter((m) => m !== undefined)
    .map((msg) => ({ ...msg!, folderId }));
  await emailDB.messages.bulkPut(updated);
}

export async function markMessagesAsRead(messageIds: string[]): Promise<void> {
  const messages = await emailDB.messages.bulkGet(messageIds);
  const updated = messages
    .filter((m) => m !== undefined)
    .map((msg) => ({ ...msg!, isRead: true }));
  await emailDB.messages.bulkPut(updated);
}

export async function markMessagesAsUnread(messageIds: string[]): Promise<void> {
  const messages = await emailDB.messages.bulkGet(messageIds);
  const updated = messages
    .filter((m) => m !== undefined)
    .map((msg) => ({ ...msg!, isRead: false }));
  await emailDB.messages.bulkPut(updated);
}

export async function starMessages(messageIds: string[]): Promise<void> {
  const messages = await emailDB.messages.bulkGet(messageIds);
  const updated = messages
    .filter((m) => m !== undefined)
    .map((msg) => ({ ...msg!, isStarred: true }));
  await emailDB.messages.bulkPut(updated);
}

export async function unstarMessages(messageIds: string[]): Promise<void> {
  const messages = await emailDB.messages.bulkGet(messageIds);
  const updated = messages
    .filter((m) => m !== undefined)
    .map((msg) => ({ ...msg!, isStarred: false }));
  await emailDB.messages.bulkPut(updated);
}

// ==================== Folder Operations ====================

export async function saveFolders(folders: EmailFolder[]): Promise<void> {
  await emailDB.folders.bulkPut(folders);
}

export async function getFolders(): Promise<EmailFolder[]> {
  return await emailDB.folders.toArray();
}

export async function getFolder(folderId: string): Promise<EmailFolder | undefined> {
  return await emailDB.folders.get(folderId);
}

export async function updateFolderCounts(folderId: string, unreadCount: number, totalCount: number): Promise<void> {
  await emailDB.folders.update(folderId, { unreadCount, totalCount });
}

export async function deleteFolder(folderId: string): Promise<void> {
  await emailDB.folders.delete(folderId);
}

// ==================== Label Operations ====================

export async function saveLabels(labels: EmailLabel[]): Promise<void> {
  await emailDB.labels.bulkPut(labels);
}

export async function getLabels(): Promise<EmailLabel[]> {
  return await emailDB.labels.toArray();
}

export async function addLabelToMessages(messageIds: string[], labelId: string): Promise<void> {
  const messages = await emailDB.messages.bulkGet(messageIds);
  const updated = messages
    .filter((m) => m !== undefined)
    .map((msg) => ({
      ...msg!,
      labels: Array.from(new Set([...(msg!.labels || []), labelId])),
    }));
  await emailDB.messages.bulkPut(updated);
}

export async function removeLabelFromMessages(messageIds: string[], labelId: string): Promise<void> {
  const messages = await emailDB.messages.bulkGet(messageIds);
  const updated = messages
    .filter((m) => m !== undefined)
    .map((msg) => ({
      ...msg!,
      labels: msg!.labels.filter((id) => id !== labelId),
    }));
  await emailDB.messages.bulkPut(updated);
}

// ==================== Draft Operations ====================

export async function saveDraft(draft: DraftEmail): Promise<string> {
  return (await emailDB.drafts.put(draft)) as any as string;
}

export async function getDraft(draftId: string): Promise<DraftEmail | undefined> {
  return await emailDB.drafts.get(draftId);
}

export async function getDrafts(): Promise<DraftEmail[]> {
  return await emailDB.drafts.toArray();
}

export async function updateDraft(draftId: string, updates: Partial<DraftEmail>): Promise<void> {
  await emailDB.drafts.update(draftId, {
    ...updates,
    lastSavedAt: new Date(),
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  await emailDB.drafts.delete(draftId);
}

// ==================== Unsent Email Queue ====================

export async function queueUnsentEmail(email: UnsentEmail): Promise<string> {
  return (await emailDB.unsentEmails.put(email)) as any as string;
}

export async function getUnsentEmails(): Promise<UnsentEmail[]> {
  return await emailDB.unsentEmails
    .where('attemptCount')
    .below(5) // max 5 retry attempts
    .toArray();
}

export async function getUnsentEmailCount(): Promise<number> {
  return await emailDB.unsentEmails.count();
}

export async function markUnsentEmailAsSent(unsentEmailId: string): Promise<void> {
  await emailDB.unsentEmails.delete(unsentEmailId);
}

export async function incrementUnsentAttempt(unsentEmailId: string, error?: string): Promise<void> {
  const email = await emailDB.unsentEmails.get(unsentEmailId);
  if (email) {
    await emailDB.unsentEmails.update(unsentEmailId, {
      attemptCount: email.attemptCount + 1,
      lastAttemptAt: new Date(),
      error: error,
    });
  }
}

// ==================== Search & Filter ====================

export async function searchMessages(query: string, folderId?: string): Promise<EmailMessage[]> {
  const allMessages = folderId
    ? await emailDB.messages.where('folderId').equals(folderId).toArray()
    : await emailDB.messages.toArray();

  const lowerQuery = query.toLowerCase();
  return allMessages.filter(
    (msg) =>
      msg.subject.toLowerCase().includes(lowerQuery) ||
      msg.body.toLowerCase().includes(lowerQuery) ||
      msg.from.email.toLowerCase().includes(lowerQuery) ||
      msg.to.some((addr) => addr.email.toLowerCase().includes(lowerQuery))
  );
}

// ==================== Sync Status ====================

export async function updateSyncStatus(syncing: boolean, nextSyncDelay: number = 300000): Promise<void> {
  const now = new Date();
  const nextSync = new Date(now.getTime() + nextSyncDelay);
  
  await emailDB.syncStatus.put({
    id: 'default',
    lastSync: now,
    nextSync,
    syncing,
  });
}

export async function getSyncStatus(): Promise<{ lastSync: Date; nextSync: Date; syncing: boolean }> {
  const status = await emailDB.syncStatus.get('default');
  return (
    status || {
      lastSync: new Date(0),
      nextSync: new Date(),
      syncing: false,
    }
  );
}

// ==================== Cleanup & Maintenance ====================

export async function clearOldMessages(beforeDate: Date): Promise<number> {
  const deleted = await emailDB.messages
    .where('timestamp')
    .below(beforeDate)
    .delete();
  return deleted;
}

export async function clearDatabase(): Promise<void> {
  await emailDB.delete();
  await emailDB.open();
}

export async function getDatabaseStats(): Promise<{
  messageCount: number;
  draftCount: number;
  unsentCount: number;
  folderCount: number;
  labelCount: number;
}> {
  return {
    messageCount: await emailDB.messages.count(),
    draftCount: await emailDB.drafts.count(),
    unsentCount: await emailDB.unsentEmails.count(),
    folderCount: await emailDB.folders.count(),
    labelCount: await emailDB.labels.count(),
  };
}
