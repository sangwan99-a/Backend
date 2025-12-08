/**
 * Documents API Integration
 * File management microservice with real-time collaboration and versioning
 */

import { getApiClient, useApi, useMutateApi } from '@/lib/api-client';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  parentId?: string; // for folders
  owner: string;
  ownerName: string;
  collaborators: DocumentCollaborator[];
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
  isShared: boolean;
  isStarred: boolean;
  tags?: string[];
  description?: string;
}

export interface DocumentCollaborator {
  userId: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'owner';
  joinedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  createdBy: string;
  createdAt: string;
  size: number;
  changeDescription?: string;
  downloads: number;
}

export interface DocumentPreview {
  documentId: string;
  preview: string; // base64 or URL
  type: 'image' | 'pdf' | 'text' | 'html';
  pageCount?: number;
  currentPage?: number;
}

export interface DocumentChange {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  timestamp: string;
  change: {
    operation: 'insert' | 'delete' | 'update';
    position: number;
    content?: string;
  };
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'commented' | 'shared' | 'moved';
  timestamp: string;
  details?: Record<string, any>;
}

export interface SharedLink {
  id: string;
  documentId: string;
  token: string;
  expiresAt?: string;
  password?: string;
  requiresPassword: boolean;
  accessCount: number;
  maxAccess?: number;
}

/**
 * Documents API Client
 */
export class DocumentsAPIClient {
  private api = getApiClient();
  private ws: Map<string, WebSocket> = new Map();

  /**
   * Get all documents/files
   */
  async listDocuments(parentId?: string, limit: number = 50, offset: number = 0): Promise<{
    items: Document[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return this.api.get(`/api/v1/files?${params}`);
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string, limit: number = 20): Promise<Document[]> {
    return this.api.get(`/api/v1/files/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  /**
   * Get document metadata
   */
  async getDocument(documentId: string): Promise<Document> {
    return this.api.get(`/api/v1/files/${documentId}`);
  }

  /**
   * Upload file
   */
  async uploadFile(
    file: File,
    parentId?: string,
    description?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) formData.append('parentId', parentId);
    if (description) formData.append('description', description);

    const response = await this.api.getClient().post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get file preview
   */
  async getPreview(documentId: string, page?: number): Promise<DocumentPreview> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());

    return this.api.get(`/api/v1/files/${documentId}/preview?${params}`);
  }

  /**
   * Download file
   */
  async downloadFile(documentId: string): Promise<Blob> {
    const response = await this.api.getClient().get(`/api/v1/files/${documentId}/download`, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<Document> {
    return this.api.patch(`/api/v1/files/${documentId}`, data);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, permanent: boolean = false): Promise<void> {
    return this.api.delete(`/api/v1/files/${documentId}?permanent=${permanent}`);
  }

  /**
   * Restore deleted document
   */
  async restoreDocument(documentId: string): Promise<Document> {
    return this.api.post(`/api/v1/files/${documentId}/restore`, {});
  }

  /**
   * Get version history
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    return this.api.get(`/api/v1/files/${documentId}/versions`);
  }

  /**
   * Restore previous version
   */
  async restoreVersion(documentId: string, versionId: string): Promise<Document> {
    return this.api.post(`/api/v1/files/${documentId}/versions/${versionId}/restore`, {});
  }

  /**
   * Download specific version
   */
  async downloadVersion(documentId: string, versionId: string): Promise<Blob> {
    const response = await this.api.getClient().get(
      `/api/v1/files/${documentId}/versions/${versionId}/download`,
      {
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Share document with users
   */
  async shareDocument(
    documentId: string,
    users: { email: string; role: 'viewer' | 'editor' }[]
  ): Promise<Document> {
    return this.api.post(`/api/v1/files/${documentId}/share`, { users });
  }

  /**
   * Create public share link
   */
  async createShareLink(
    documentId: string,
    config?: {
      expiresAt?: string;
      password?: string;
      maxAccess?: number;
    }
  ): Promise<SharedLink> {
    return this.api.post(`/api/v1/files/${documentId}/share-link`, config);
  }

  /**
   * Delete share link
   */
  async deleteShareLink(linkId: string): Promise<void> {
    return this.api.delete(`/api/v1/files/share-links/${linkId}`);
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(documentId: string, userId: string): Promise<Document> {
    return this.api.delete(`/api/v1/files/${documentId}/collaborators/${userId}`);
  }

  /**
   * Get activity log
   */
  async getActivity(documentId: string, limit: number = 50): Promise<DocumentActivity[]> {
    return this.api.get(`/api/v1/files/${documentId}/activity?limit=${limit}`);
  }

  /**
   * Apply operational transformation (OT) change
   */
  async applyChange(documentId: string, change: DocumentChange): Promise<{ version: number }> {
    return this.api.post(`/api/v1/files/${documentId}/apply-change`, change);
  }

  /**
   * Subscribe to document for real-time collaboration
   */
  subscribeToDocument(
    documentId: string,
    onChange: (change: DocumentChange) => void,
    onCollaboratorUpdate?: (data: any) => void,
    onError?: (error: Error) => void
  ): () => void {
    const wsUrl = `${this.api.getClient().defaults.baseURL?.replace(/^http/, 'ws')}/ws/documents/${documentId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`✅ Connected to document: ${documentId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'change') {
          onChange(data.payload);
        } else if (data.type === 'collaborator' && onCollaboratorUpdate) {
          onCollaboratorUpdate(data.payload);
        }
      } catch (error) {
        console.error('Failed to parse document update:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Document WebSocket error:', error);
      if (onError) {
        onError(new Error('WebSocket connection failed'));
      }
    };

    ws.onclose = () => {
      console.log(`❌ Disconnected from document: ${documentId}`);
      this.ws.delete(documentId);
    };

    this.ws.set(documentId, ws);

    // Return unsubscribe function
    return () => {
      ws.close();
      this.ws.delete(documentId);
    };
  }

  /**
   * Star/unstar document
   */
  async toggleStar(documentId: string): Promise<Document> {
    return this.api.post(`/api/v1/files/${documentId}/toggle-star`, {});
  }

  /**
   * Get starred documents
   */
  async getStarred(limit: number = 50): Promise<Document[]> {
    return this.api.get(`/api/v1/files/starred?limit=${limit}`);
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribeAll(): void {
    this.ws.forEach((ws) => {
      ws.close();
    });
    this.ws.clear();
  }
}

/**
 * Export singleton instance
 */
export const documentsAPI = new DocumentsAPIClient();

/**
 * React hooks for document data
 */

/**
 * Hook to fetch documents
 */
export function useDocuments(parentId?: string) {
  return useApi(
    ['documents', parentId ?? 'root'] as const,
    () => documentsAPI.listDocuments(parentId),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Hook to search documents
 */
export function useSearchDocuments(query: string) {
  return useApi(
    ['documents-search', query],
    () => documentsAPI.searchDocuments(query),
    {
      enabled: !!query,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to fetch document details
 */
export function useDocument(documentId: string) {
  return useApi(['document', documentId], () => documentsAPI.getDocument(documentId), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get document preview
 */
export function useDocumentPreview(documentId: string, page?: number) {
  return useApi(
    ['document-preview', documentId, String(page ?? 1)] as const,
    () => documentsAPI.getPreview(documentId, page),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

/**
 * Hook to get version history
 */
export function useDocumentVersions(documentId: string) {
  return useApi(['document-versions', documentId], () => documentsAPI.getVersions(documentId), {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get activity log
 */
export function useDocumentActivity(documentId: string) {
  return useApi(['document-activity', documentId], () => documentsAPI.getActivity(documentId), {
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get starred documents
 */
export function useStarredDocuments() {
  return useApi(['starred-documents'], () => documentsAPI.getStarred(), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to upload file
 */
export function useUploadFile() {
  return useMutateApi(
    ({
      file,
      parentId,
      description,
    }: {
      file: File;
      parentId?: string;
      description?: string;
    }) => documentsAPI.uploadFile(file, parentId, description)
  );
}

/**
 * Hook to update document
 */
export function useUpdateDocument() {
  return useMutateApi(
    ({
      documentId,
      data,
    }: {
      documentId: string;
      data: {
        name?: string;
        description?: string;
        tags?: string[];
      };
    }) => documentsAPI.updateDocument(documentId, data)
  );
}

/**
 * Hook to delete document
 */
export function useDeleteDocument() {
  return useMutateApi(
    ({ documentId, permanent }: { documentId: string; permanent?: boolean }) =>
      documentsAPI.deleteDocument(documentId, permanent)
  );
}

/**
 * Hook to restore document
 */
export function useRestoreDocument() {
  return useMutateApi((documentId: string) => documentsAPI.restoreDocument(documentId));
}

/**
 * Hook to restore version
 */
export function useRestoreVersion() {
  return useMutateApi(
    ({ documentId, versionId }: { documentId: string; versionId: string }) =>
      documentsAPI.restoreVersion(documentId, versionId)
  );
}

/**
 * Hook to share document
 */
export function useShareDocument() {
  return useMutateApi(
    ({
      documentId,
      users,
    }: {
      documentId: string;
      users: { email: string; role: 'viewer' | 'editor' }[];
    }) => documentsAPI.shareDocument(documentId, users)
  );
}

/**
 * Hook to create share link
 */
export function useCreateShareLink() {
  return useMutateApi(
    ({
      documentId,
      config,
    }: {
      documentId: string;
      config?: {
        expiresAt?: string;
        password?: string;
        maxAccess?: number;
      };
    }) => documentsAPI.createShareLink(documentId, config)
  );
}

/**
 * Hook to toggle star
 */
export function useToggleStar() {
  return useMutateApi((documentId: string) => documentsAPI.toggleStar(documentId));
}
