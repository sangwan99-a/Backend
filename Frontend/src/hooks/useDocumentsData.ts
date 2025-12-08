/**
 * Documents Data Hooks - React Query integration for file management
 * 
 * Queries:
 * - useFiles: Get files in folder
 * - useFile: Get single file
 * - useFolders: Get subfolders
 * - useFolder: Get single folder
 * - useFileVersions: Get version history
 * - useFileComments: Get file comments
 * - useStarredFiles: Get starred files
 * - useSearchFiles: Search files by name/tags
 * 
 * Mutations:
 * - useCreateFolder: Create new folder
 * - useRenameFile: Rename file
 * - useUploadFile: Upload file to folder
 * - useMoveFile: Move file to folder
 * - useBulkMoveFiles: Move multiple files
 * - useShareFile: Share file with users
 * - useDeleteFile: Delete file
 * - useRestoreFile: Restore from trash
 * - useAddComment: Add comment to file
 * - useStarFile: Toggle star status
 * - useTrashFile: Move to trash
 */

import { useMutation, useQuery, useQueryClient } from 'react-query';
import type {
  File,
  Folder,
  FileVersion,
  FileComment,
  FileSharingInfo,
} from '../types/documents';
import * as db from '@/services/documentsDatabase';

const QUERY_KEYS = {
  files: ['files'],
  file: (id: string) => ['file', id],
  folders: ['folders'],
  folder: (id: string) => ['folder', id],
  versions: (fileId: string) => ['versions', fileId],
  comments: (fileId: string) => ['comments', fileId],
  starred: (owner: string) => ['starred', owner],
  search: (query: string) => ['search', query],
};

/**
 * QUERIES
 */

export const useFiles = (folderId: string, enabled = true) => {
  return useQuery({
    queryKey: ['files', folderId],
    queryFn: () => db.getFolderFiles(folderId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFile = (fileId: string | null, enabled = true) => {
  return useQuery({
    queryKey: fileId ? ['file', fileId] : ['file', null],
    queryFn: () => (fileId ? db.getFile(fileId) : Promise.resolve(undefined)),
    enabled: enabled && !!fileId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useFolders = (parentFolderId: string, owner?: string, enabled = true) => {
  return useQuery({
    queryKey: ['folders', parentFolderId, owner],
    queryFn: () => db.getFolders(parentFolderId, owner),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};

export const useFolder = (folderId: string | null, enabled = true) => {
  return useQuery({
    queryKey: folderId ? ['folder', folderId] : ['folder', null],
    queryFn: () => (folderId ? db.getFolder(folderId) : Promise.resolve(undefined)),
    enabled: enabled && !!folderId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useFileVersions = (fileId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['versions', fileId],
    queryFn: () => (fileId ? db.getFileVersions(fileId) : Promise.resolve([])),
    enabled: enabled && !!fileId,
    staleTime: 1000 * 60 * 10, // Versions change rarely
  });
};

export const useFileComments = (fileId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['comments', fileId],
    queryFn: () => (fileId ? db.getFileComments(fileId) : Promise.resolve([])),
    enabled: enabled && !!fileId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useStarredFiles = (owner: string, enabled = true) => {
  return useQuery({
    queryKey: ['starred', owner],
    queryFn: () => db.getStarredFiles(owner),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTrashedFiles = (owner: string, enabled = true) => {
  return useQuery({
    queryKey: ['trashed', owner],
    queryFn: () => db.getTrashedFiles(owner),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSearchFiles = (query: string | null | undefined, folderId?: string | null, owner?: string, enabled = true) => {
  return useQuery({
    queryKey: ['search', query, folderId, owner],
    queryFn: () => (query ? db.searchFiles(query, folderId || undefined, owner) : Promise.resolve([])),
    enabled: enabled && !!query && query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};

export const useFileActivity = (fileId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['activity', fileId],
    queryFn: () => (fileId ? db.getFileActivity(fileId) : Promise.resolve([])),
    enabled: enabled && !!fileId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * MUTATIONS
 */

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folder: Folder) => {
      const id = await db.saveFolder(folder);
      return { ...folder, id };
    },
    onMutate: async (newFolder: Folder) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: ['folders', newFolder.parentFolderId],
      });

      // Snapshot previous data
      const previousFolders = queryClient.getQueryData([
        'folders',
        newFolder.parentFolderId,
      ]);

      // Optimistically update
      queryClient.setQueryData(['folders', newFolder.parentFolderId], (old: Folder[] | undefined) => [
        ...(old || []),
        newFolder,
      ]);

      return { previousFolders };
    },
    onError: (_err: any, newFolder: Folder, context: any) => {
      // Rollback on error
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders', newFolder.parentFolderId], context.previousFolders);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

export const useRenameFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, name }: { fileId: string; name: string }) => {
      await db.updateFile(fileId, { name });
    },
    onMutate: async ({ fileId, name }: { fileId: string; name: string }) => {
      await queryClient.cancelQueries({ queryKey: ['file', fileId] });
      const previousFile = queryClient.getQueryData(['file', fileId]);
      queryClient.setQueryData(['file', fileId], (old: any) =>
        old ? { ...old, name } : old
      );
      return { previousFile };
    },
    onError: (_err: any, { fileId }: { fileId: string }, context: any) => {
      if (context?.previousFile) {
        queryClient.setQueryData(['file', fileId], context.previousFile);
      }
    },
    onSuccess: (_data: any, { fileId }: { fileId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const id = await db.saveFile(file);
      return { ...file, id };
    },
    onMutate: async (newFile: File) => {
      await queryClient.cancelQueries({
        queryKey: ['files', newFile.folderId],
      });

      const previousFiles = queryClient.getQueryData(['files', newFile.folderId]);
      queryClient.setQueryData(['files', newFile.folderId], (old: File[] | undefined) => [
        ...(old || []),
        newFile,
      ]);

      return { previousFiles };
    },
    onError: (_err: any, newFile: File, context: any) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(['files', newFile.folderId], context.previousFiles);
      }
    },
    onSuccess: (_data: any, newFile: File) => {
      queryClient.invalidateQueries({ queryKey: ['files', newFile.folderId] });
    },
  });
};

export const useMoveFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      currentFolderId,
      targetFolderId,
    }: {
      fileId: string;
      currentFolderId: string;
      targetFolderId: string;
    }) => {
      await db.moveFile(fileId, targetFolderId);
    },
    onMutate: async ({ fileId, currentFolderId, targetFolderId }: { fileId: string; currentFolderId: string; targetFolderId: string }) => {
      await queryClient.cancelQueries({ queryKey: ['files'] });

      const previousCurrent = queryClient.getQueryData(['files', currentFolderId]);
      const previousTarget = queryClient.getQueryData(['files', targetFolderId]);

      // Remove from current folder
      queryClient.setQueryData(['files', currentFolderId], (old: any) =>
        old ? old.filter((f: any) => f.id !== fileId) : old
      );

      // Add to target folder
      queryClient.setQueryData(['files', targetFolderId], (old: any) => {
        const file = (previousCurrent as File[] | undefined)?.find((f) => f.id === fileId);
        return file ? [...(old || []), file] : old;
      });

      return { previousCurrent, previousTarget };
    },
    onError: (_err: any, { currentFolderId, targetFolderId }: { currentFolderId: string; targetFolderId: string }, context: any) => {
      if (context?.previousCurrent) {
        queryClient.setQueryData(['files', currentFolderId], context.previousCurrent);
      }
      if (context?.previousTarget) {
        queryClient.setQueryData(['files', targetFolderId], context.previousTarget);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useBulkMoveFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileIds,
      currentFolderId,
      targetFolderId,
    }: {
      fileIds: string[];
      currentFolderId: string;
      targetFolderId: string;
    }) => {
      await db.bulkMoveFiles(fileIds, targetFolderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useShareFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      sharing,
    }: {
      fileId: string;
      sharing: FileSharingInfo;
    }) => {
      await db.updateFile(fileId, { sharing });
    },
    onMutate: async ({ fileId, sharing }: { fileId: string; sharing: FileSharingInfo }) => {
      await queryClient.cancelQueries({ queryKey: ['file', fileId] });
      const previousFile = queryClient.getQueryData(['file', fileId]);

      queryClient.setQueryData(['file', fileId], (old: any) =>
        old ? { ...old, sharing } : old
      );

      return { previousFile };
    },
    onError: (_err: any, { fileId }: { fileId: string }, context: any) => {
      if (context?.previousFile) {
        queryClient.setQueryData(['file', fileId], context.previousFile);
      }
    },
    onSuccess: (_data: any, { fileId }: { fileId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      await db.deleteFile(fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useRestoreFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      await db.restoreFile(fileId);
    },
    onMutate: async (fileId: string) => {
      await queryClient.cancelQueries({ queryKey: ['file', fileId] });
      const previousFile = queryClient.getQueryData(['file', fileId]);

      queryClient.setQueryData(['file', fileId], (old: any) =>
        old ? { ...old, trashed: false, trashedAt: undefined } : old
      );

      return { previousFile };
    },
    onError: (_err: any, fileId: string, context: any) => {
      if (context?.previousFile) {
        queryClient.setQueryData(['file', fileId], context.previousFile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['trashed'] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: FileComment) => {
      const id = await db.saveFileComment(comment);
      return { ...comment, id };
    },
    onMutate: async (newComment: FileComment) => {
      await queryClient.cancelQueries({
        queryKey: ['comments', newComment.fileId],
      });

      const previousComments = queryClient.getQueryData(['comments', newComment.fileId]);

      queryClient.setQueryData(['comments', newComment.fileId], (old: FileComment[] | undefined) => [
        ...(old || []),
        newComment,
      ]);

      return { previousComments };
    },
    onError: (_err: any, newComment: FileComment, context: any) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', newComment.fileId], context.previousComments);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};

export const useStarFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      await db.starFile(fileId);
    },
    onMutate: async (fileId: string) => {
      await queryClient.cancelQueries({ queryKey: ['file', fileId] });
      const previousFile = queryClient.getQueryData(['file', fileId]);

      queryClient.setQueryData(['file', fileId], (old: any) =>
        old ? { ...old, starred: !old.starred } : old
      );

      return { previousFile };
    },
    onError: (_err: any, fileId: string, context: any) => {
      if (context?.previousFile) {
        queryClient.setQueryData(['file', fileId], context.previousFile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['starred'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useTrashFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      await db.trashFile(fileId);
    },
    onMutate: async (fileId: string) => {
      await queryClient.cancelQueries({ queryKey: ['file', fileId] });
      const previousFile = queryClient.getQueryData(['file', fileId]);

      queryClient.setQueryData(['file', fileId], (old: any) =>
        old ? { ...old, trashed: true, trashedAt: new Date().toISOString() } : old
      );

      return { previousFile };
    },
    onError: (_err: any, fileId: string, context: any) => {
      if (context?.previousFile) {
        queryClient.setQueryData(['file', fileId], context.previousFile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['trashed'] });
    },
  });
};

export const useBulkStarFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileIds, star }: { fileIds: string[]; star: boolean }) => {
      await db.bulkStarFiles(fileIds, star);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['starred'] });
    },
  });
};

export const useBulkTrashFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileIds: string[]) => {
      await db.bulkTrashFiles(fileIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['trashed'] });
    },
  });
};
