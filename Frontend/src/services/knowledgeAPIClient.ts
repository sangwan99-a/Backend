/**
 * Knowledge Base Module API Client
 * Backend integration for article management, comments, and publishing
 */

import {
  Article,
  KnowledgeCategory,
  ArticleComment,
  ArticleVersion,
  KnowledgeCollection,
  ReadingProgress,
} from '../types/knowledge';

export interface ArticleRequest {
  title: string;
  content: string;
  categoryId?: string;
  tags?: string[];
  templateId?: string;
}

export interface ArticleUpdateRequest extends Partial<ArticleRequest> {
  id: string;
}

export interface CommentRequest {
  content: string;
  position?: number;
  mentions?: string[];
}

export interface CommentReplyRequest {
  content: string;
  mentions?: string[];
}

class KnowledgeAPIClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = process.env.REACT_APP_API_URL || 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // ==================== ARTICLES ====================

  /**
   * Create new article
   */
  async createArticle(request: ArticleRequest): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        createdAt: new Date().toISOString(),
        status: 'draft',
      }),
    });

    return this.handleResponse(response);
  }

  /**
   * Get article by ID
   */
  async getArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Get all articles with optional filters
   */
  async getArticles(filters?: {
    categoryId?: string;
    search?: string;
    tags?: string[];
    status?: 'draft' | 'published';
    sortBy?: 'created' | 'modified' | 'views' | 'starred';
    limit?: number;
    offset?: number;
  }): Promise<{ articles: Article[]; total: number }> {
    const query = new URLSearchParams();
    if (filters) {
      if (filters.categoryId) query.append('categoryId', filters.categoryId);
      if (filters.search) query.append('search', filters.search);
      if (filters.tags) query.append('tags', filters.tags.join(','));
      if (filters.status) query.append('status', filters.status);
      if (filters.sortBy) query.append('sort', filters.sortBy);
      if (filters.limit) query.append('limit', filters.limit.toString());
      if (filters.offset) query.append('offset', filters.offset.toString());
    }

    const response = await fetch(`${this.baseUrl}/knowledge/articles?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Update article
   */
  async updateArticle(articleId: string, request: Partial<ArticleRequest>): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        modifiedAt: new Date().toISOString(),
      }),
    });

    return this.handleResponse(response);
  }

  /**
   * Delete article
   */
  async deleteArticle(articleId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    await this.handleResponse(response);
  }

  /**
   * Publish article
   */
  async publishArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/publish`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ publishedAt: new Date().toISOString() }),
    });

    return this.handleResponse(response);
  }

  /**
   * Unpublish article
   */
  async unpublishArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/unpublish`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Archive article
   */
  async archiveArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/archive`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Get featured/published articles
   */
  async getFeaturedArticles(limit = 10): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/featured?limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse(response);
    return data.articles || [];
  }

  /**
   * Search articles by keyword
   */
  async searchArticles(query: string, limit = 20): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/search?q=${query}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse(response);
    return data.articles || [];
  }

  /**
   * Get related articles
   */
  async getRelatedArticles(articleId: string, limit = 5): Promise<Article[]> {
    const response = await fetch(
      `${this.baseUrl}/knowledge/articles/${articleId}/related?limit=${limit}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const data = await this.handleResponse(response);
    return data.articles || [];
  }

  /**
   * Bulk delete articles
   */
  async bulkDeleteArticles(articleIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/bulk-delete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ articleIds }),
    });

    await this.handleResponse(response);
  }

  // ==================== CATEGORIES ====================

  /**
   * Create category
   */
  async createCategory(name: string, description?: string, icon?: string): Promise<KnowledgeCategory> {
    const response = await fetch(`${this.baseUrl}/knowledge/categories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description, icon }),
    });

    return this.handleResponse(response);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<KnowledgeCategory[]> {
    const response = await fetch(`${this.baseUrl}/knowledge/categories`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse(response);
    return data.categories || [];
  }

  /**
   * Get category by ID
   */
  async getCategory(categoryId: string): Promise<KnowledgeCategory> {
    const response = await fetch(`${this.baseUrl}/knowledge/categories/${categoryId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<KnowledgeCategory>
  ): Promise<KnowledgeCategory> {
    const response = await fetch(`${this.baseUrl}/knowledge/categories/${categoryId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    return this.handleResponse(response);
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/knowledge/categories/${categoryId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    await this.handleResponse(response);
  }

  /**
   * Get articles in category
   */
  async getCategoryArticles(
    categoryId: string,
    filters?: { limit?: number; offset?: number; sortBy?: string }
  ): Promise<{ articles: Article[]; total: number }> {
    const query = new URLSearchParams();
    if (filters) {
      if (filters.limit) query.append('limit', filters.limit.toString());
      if (filters.offset) query.append('offset', filters.offset.toString());
      if (filters.sortBy) query.append('sort', filters.sortBy);
    }

    const response = await fetch(
      `${this.baseUrl}/knowledge/categories/${categoryId}/articles?${query.toString()}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  // ==================== COMMENTS ====================

  /**
   * Add comment to article
   */
  async addComment(articleId: string, request: CommentRequest): Promise<ArticleComment> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        timestamp: new Date().toISOString(),
      }),
    });

    return this.handleResponse(response);
  }

  /**
   * Get article comments
   */
  async getComments(articleId: string): Promise<ArticleComment[]> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/comments`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse(response);
    return data.comments || [];
  }

  /**
   * Reply to comment
   */
  async replyToComment(
    articleId: string,
    commentId: string,
    request: CommentReplyRequest
  ): Promise<ArticleComment> {
    const response = await fetch(
      `${this.baseUrl}/knowledge/articles/${articleId}/comments/${commentId}/replies`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          timestamp: new Date().toISOString(),
        }),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Resolve comment
   */
  async resolveComment(articleId: string, commentId: string): Promise<ArticleComment> {
    const response = await fetch(
      `${this.baseUrl}/knowledge/articles/${articleId}/comments/${commentId}/resolve`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ resolvedAt: new Date().toISOString() }),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Delete comment
   */
  async deleteComment(articleId: string, commentId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/knowledge/articles/${articleId}/comments/${commentId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    await this.handleResponse(response);
  }

  // ==================== VERSIONS ====================

  /**
   * Get article versions
   */
  async getVersions(articleId: string): Promise<ArticleVersion[]> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/versions`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse(response);
    return data.versions || [];
  }

  /**
   * Get specific version
   */
  async getVersion(articleId: string, versionNumber: number): Promise<ArticleVersion> {
    const response = await fetch(
      `${this.baseUrl}/knowledge/articles/${articleId}/versions/${versionNumber}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Restore article to version
   */
  async restoreVersion(articleId: string, versionNumber: number): Promise<Article> {
    const response = await fetch(
      `${this.baseUrl}/knowledge/articles/${articleId}/versions/${versionNumber}/restore`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  // ==================== READING PROGRESS ====================

  /**
   * Update reading progress
   */
  async updateReadingProgress(
    articleId: string,
    progress: number,
    bookmarked?: boolean
  ): Promise<ReadingProgress> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/progress`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        progress,
        bookmarked,
        lastAccessedAt: new Date().toISOString(),
      }),
    });

    return this.handleResponse(response);
  }

  /**
   * Get reading progress
   */
  async getReadingProgress(articleId: string): Promise<ReadingProgress> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/progress`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Star article
   */
  async starArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/star`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Unstar article
   */
  async unstarArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/unstar`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ==================== COLLECTIONS ====================

  /**
   * Create collection
   */
  async createCollection(name: string, description?: string): Promise<KnowledgeCollection> {
    const response = await fetch(`${this.baseUrl}/knowledge/collections`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        description,
        createdAt: new Date().toISOString(),
      }),
    });

    return this.handleResponse(response);
  }

  /**
   * Get collections
   */
  async getCollections(): Promise<KnowledgeCollection[]> {
    const response = await fetch(`${this.baseUrl}/knowledge/collections`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse(response);
    return data.collections || [];
  }

  /**
   * Add article to collection
   */
  async addToCollection(
    collectionId: string,
    articleId: string
  ): Promise<KnowledgeCollection> {
    const response = await fetch(`${this.baseUrl}/knowledge/collections/${collectionId}/articles`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ articleId }),
    });

    return this.handleResponse(response);
  }

  /**
   * Remove article from collection
   */
  async removeFromCollection(
    collectionId: string,
    articleId: string
  ): Promise<KnowledgeCollection> {
    const response = await fetch(
      `${this.baseUrl}/knowledge/collections/${collectionId}/articles/${articleId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  // ==================== ANALYTICS ====================

  /**
   * Get article analytics
   */
  async getArticleAnalytics(articleId: string): Promise<{
    views: number;
    avgReadTime: number;
    completionRate: number;
    lastViewedAt: Date;
  }> {
    const response = await fetch(`${this.baseUrl}/knowledge/articles/${articleId}/analytics`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Get knowledge base analytics
   */
  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalArticles: number;
    publishedArticles: number;
    totalViews: number;
    avgReadTime: number;
    topArticles: Array<{ id: string; title: string; views: number }>;
    mostActiveAuthors: Array<{ id: string; name: string; articleCount: number }>;
  }> {
    const query = new URLSearchParams();
    if (dateRange) {
      query.append('startDate', dateRange.start.toISOString());
      query.append('endDate', dateRange.end.toISOString());
    }

    const response = await fetch(`${this.baseUrl}/knowledge/analytics?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ==================== HELPERS ====================

  /**
   * Set authorization token
   */
  setAuthToken(token: string): void {
    (this.defaultHeaders as any)['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Get headers with auth token
   */
  private getHeaders(): HeadersInit {
    return {
      ...this.defaultHeaders,
    };
  }

  /**
   * Handle API response
   */
  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    } else {
      return response.text();
    }
  }
}

// Singleton instance
let instance: KnowledgeAPIClient | null = null;

export const getKnowledgeAPIClient = (baseUrl?: string): KnowledgeAPIClient => {
  if (!instance) {
    instance = new KnowledgeAPIClient(baseUrl);
  }
  return instance;
};

export default KnowledgeAPIClient;
