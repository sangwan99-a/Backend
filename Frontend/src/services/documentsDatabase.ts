/**
 * Documents Database Service - IndexedDB layer for file management
 * 
 * Tables:
 * - files: File metadata and properties
 * - folders: Folder structure
 * - fileVersions: Version history
 * - fileComments: Comments and discussions
 * - fileActivity: Activity logs
 * - uploadSessions: Resumable upload tracking
 * - sharedFiles: Sharing configurations
 */

import Dexie, { Table } from 'dexie';
import type {
  File,
  Folder,
  FileVersion,
  FileComment,
  FileActivity,
  UploadSession,
  FileSharingInfo,
} from '../types/documents';

/**
 * Documents Database
 */
class DocumentsDB extends Dexie {
  files!: Table<File>;
  folders!: Table<Folder>;
  fileVersions!: Table<FileVersion>;
  fileComments!: Table<FileComment>;
  fileActivity!: Table<FileActivity>;
  uploadSessions!: Table<UploadSession>;

  constructor() {
    super('FusionDeskDocumentsDB');
    this.version(1).stores({
      files: 'id, folderId, owner, [folderId+owner], [owner+modifiedAt], starred, trashed',
      folders: 'id, parentFolderId, owner, [owner+parentFolderId]',
      fileVersions: 'id, fileId, [fileId+versionNumber]',
      fileComments: 'id, fileId, authorId, [fileId+createdAt]',
      fileActivity: 'id, fileId, userId, [fileId+timestamp]',
      uploadSessions: 'id, folderId, status, [folderId+status]',
    });
  }
}

export const db = new DocumentsDB();

/**
 * FILE OPERATIONS
 */

export const saveFile = async (file: File): Promise<any> => {
  return await db.files.put(file);
};

export const getFile = async (fileId: string): Promise<File | undefined> => {
  return db.files.get(fileId);
};

export const getFiles = async (folderId?: string, owner?: string): Promise<File[]> => {
  if (folderId && owner) {
    return db.files.where('[folderId+owner]').equals([folderId, owner]).toArray();
  }
  if (folderId) {
    return db.files.where('folderId').equals(folderId).toArray();
  }
  if (owner) {
    return db.files.where('owner').equals(owner).toArray();
  }
  return db.files.toArray();
};

export const getFolderFiles = async (folderId: string): Promise<File[]> => {
  return db.files.where('folderId').equals(folderId).toArray();
};

export const getStarredFiles = async (owner: string): Promise<File[]> => {
  return db.files.where('owner').equals(owner).filter((f) => f.starred).toArray();
};

export const getTrashedFiles = async (owner: string): Promise<File[]> => {
  return db.files.where('owner').equals(owner).filter((f) => f.trashed).toArray();
};

export const updateFile = async (fileId: string, updates: Partial<File>): Promise<void> => {
  await db.files.update(fileId, {
    ...updates,
    modifiedAt: new Date().toISOString(),
  });
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await db.files.delete(fileId);
  // Cascade delete related data
  await db.fileVersions.where('fileId').equals(fileId).delete();
  await db.fileComments.where('fileId').equals(fileId).delete();
  await db.fileActivity.where('fileId').equals(fileId).delete();
};

export const moveFile = async (fileId: string, targetFolderId: string): Promise<void> => {
  await updateFile(fileId, { folderId: targetFolderId });
};

export const bulkMoveFiles = async (fileIds: string[], targetFolderId: string): Promise<void> => {
  const now = new Date().toISOString();
  for (const fileId of fileIds) {
    await updateFile(fileId, { folderId: targetFolderId, modifiedAt: now });
  }
};

export const searchFiles = async (
  query: string,
  folderId?: string,
  owner?: string
): Promise<File[]> => {
  const queryLower = query.toLowerCase();
  const allFiles = await getFiles(folderId, owner);
  return allFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(queryLower) ||
      f.description?.toLowerCase().includes(queryLower) ||
      f.tags.some((t) => t.toLowerCase().includes(queryLower))
  );
};

export const starFile = async (fileId: string): Promise<void> => {
  const file = await getFile(fileId);
  if (file) {
    await updateFile(fileId, { starred: !file.starred });
  }
};

export const trashFile = async (fileId: string): Promise<void> => {
  await updateFile(fileId, {
    trashed: true,
    trashedAt: new Date().toISOString(),
  });
};

export const restoreFile = async (fileId: string): Promise<void> => {
  await updateFile(fileId, {
    trashed: false,
    trashedAt: undefined,
  });
};

/**
 * FOLDER OPERATIONS
 */

export const saveFolder = async (folder: Folder): Promise<any> => {
  return await db.folders.put(folder);
};

export const getFolder = async (folderId: string): Promise<Folder | undefined> => {
  return db.folders.get(folderId);
};

export const getFolders = async (parentFolderId?: string, owner?: string): Promise<Folder[]> => {
  if (parentFolderId && owner) {
    return db.folders
      .where('[owner+parentFolderId]')
      .equals([owner, parentFolderId])
      .toArray();
  }
  if (parentFolderId) {
    return db.folders.where('parentFolderId').equals(parentFolderId).toArray();
  }
  if (owner) {
    return db.folders.where('owner').equals(owner).toArray();
  }
  return db.folders.toArray();
};

export const updateFolder = async (folderId: string, updates: Partial<Folder>): Promise<void> => {
  await db.folders.update(folderId, {
    ...updates,
    modifiedAt: new Date().toISOString(),
  });
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  // Get all files and subfolders
  const files = await getFolderFiles(folderId);
  const subfolders = await getFolders(folderId);

  // Delete all files
  for (const file of files) {
    await deleteFile(file.id);
  }

  // Delete all subfolders recursively
  for (const subfolder of subfolders) {
    await deleteFolder(subfolder.id);
  }

  // Delete folder itself
  await db.folders.delete(folderId);
};

/**
 * FILE VERSION OPERATIONS
 */

export const saveFileVersion = async (version: FileVersion): Promise<any> => {
  return await db.fileVersions.put(version);
};

export const getFileVersions = async (fileId: string): Promise<FileVersion[]> => {
  return db.fileVersions.where('fileId').equals(fileId).reverse().sortBy('versionNumber');
};

export const getFileVersion = async (versionId: string): Promise<FileVersion | undefined> => {
  return db.fileVersions.get(versionId);
};

export const deleteFileVersion = async (versionId: string): Promise<void> => {
  await db.fileVersions.delete(versionId);
};

/**
 * FILE COMMENT OPERATIONS
 */

export const saveFileComment = async (comment: FileComment): Promise<any> => {
  return await db.fileComments.put(comment);
};

export const getFileComments = async (fileId: string): Promise<FileComment[]> => {
  return db.fileComments.where('fileId').equals(fileId).reverse().sortBy('createdAt');
};

export const updateFileComment = async (commentId: string, updates: Partial<FileComment>): Promise<void> => {
  await db.fileComments.update(commentId, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteFileComment = async (commentId: string): Promise<void> => {
  await db.fileComments.delete(commentId);
};

/**
 * FILE ACTIVITY OPERATIONS
 */

export const saveFileActivity = async (activity: FileActivity): Promise<any> => {
  return await db.fileActivity.put(activity);
};

export const getFileActivity = async (fileId: string): Promise<FileActivity[]> => {
  return db.fileActivity.where('fileId').equals(fileId).reverse().sortBy('timestamp');
};

export const deleteOldActivity = async (beforeDate: string): Promise<number> => {
  const activities = await db.fileActivity.where('timestamp').below(beforeDate).toArray();
  await db.fileActivity.bulkDelete(activities.map((a) => a.id));
  return activities.length;
};

/**
 * UPLOAD SESSION OPERATIONS
 */

export const saveUploadSession = async (session: UploadSession): Promise<any> => {
  return await db.uploadSessions.put(session);
};

export const getUploadSession = async (sessionId: string): Promise<UploadSession | undefined> => {
  return db.uploadSessions.get(sessionId);
};

export const getUploadSessions = async (folderId: string): Promise<UploadSession[]> => {
  return db.uploadSessions.where('folderId').equals(folderId).toArray();
};

export const updateUploadSession = async (
  sessionId: string,
  updates: Partial<UploadSession>
): Promise<void> => {
  await db.uploadSessions.update(sessionId, updates);
};

export const deleteUploadSession = async (sessionId: string): Promise<void> => {
  await db.uploadSessions.delete(sessionId);
};

export const deleteCompletedUploadSessions = async (beforeDate: string): Promise<number> => {
  const sessions = await db.uploadSessions
    .where('completedAt')
    .below(beforeDate)
    .filter((s) => s.status === 'completed')
    .toArray();
  await db.uploadSessions.bulkDelete(sessions.map((s) => s.id));
  return sessions.length;
};

/**
 * BULK OPERATIONS
 */

export const bulkDeleteFiles = async (fileIds: string[]): Promise<void> => {
  for (const fileId of fileIds) {
    await deleteFile(fileId);
  }
};

export const bulkStarFiles = async (fileIds: string[], star: boolean): Promise<void> => {
  const now = new Date().toISOString();
  for (const fileId of fileIds) {
    await updateFile(fileId, { starred: star, modifiedAt: now });
  }
};

export const bulkTrashFiles = async (fileIds: string[]): Promise<void> => {
  const now = new Date().toISOString();
  for (const fileId of fileIds) {
    await updateFile(fileId, {
      trashed: true,
      trashedAt: now,
      modifiedAt: now,
    });
  }
};

/**
 * SYNC OPERATIONS
 */

export const getFilesModifiedSince = async (since: string): Promise<File[]> => {
  return db.files.where('modifiedAt').aboveOrEqual(since).toArray();
};

export const getFoldersModifiedSince = async (since: string): Promise<Folder[]> => {
  return db.folders.where('modifiedAt').aboveOrEqual(since).toArray();
};

/**
 * CLEAR ALL DATA
 */

export const clearAllData = async (): Promise<void> => {
  await db.delete();
  await db.open();
};
