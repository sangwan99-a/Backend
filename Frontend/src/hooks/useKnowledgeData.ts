/**
 * Knowledge Base Module React Query Hooks
 * Manages articles, categories, comments, and reading progress
 */

import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Article,
  KnowledgeCategory,
  ArticleComment,
  ReadingProgress,
  KnowledgeTemplate,
  KnowledgeCollection,
  ArticleFeedback,
} from '../types/knowledge';
import { knowledgeDb } from '../services/knowledgeDatabase';

const KNOWLEDGE_API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// ==================== Query Hooks ====================

/**
 * Get article by ID
 */
export const useArticle = (articleId: string, enabled: boolean = true) => {
  return useQuery(
    ['article', articleId],
    async () => {
      return knowledgeDb.getArticle(articleId);
    },
    {
      enabled,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

/**
 * Get article by slug
 */
export const useArticleBySlug = (slug: string, enabled: boolean = true) => {
  return useQuery(
    ['articleSlug', slug],
    async () => {
      return knowledgeDb.getArticleBySlug(slug);
    },
    {
      enabled: enabled && slug.length > 0,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 20, // 20 minutes
    }
  );
};

/**
 * Get articles by category
 */
export const useArticlesByCategory = (categoryId: string, enabled: boolean = true) => {
  return useQuery(
    ['articlesByCategory', categoryId],
    async () => {
      return knowledgeDb.getArticlesByCategory(categoryId);
    },
    {
      enabled: enabled && categoryId.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

/**
 * Get published articles
 */
export const usePublishedArticles = (limit: number = 50, enabled: boolean = true) => {
  return useQuery(
    ['publishedArticles'],
    async () => {
      return knowledgeDb.getPublishedArticles();
    },
    {
      enabled,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    }
  );
};

/**
 * Get public articles
 */
export const usePublicArticles = (enabled: boolean = true) => {
  return useQuery(
    ['publicArticles'],
    async () => {
      return knowledgeDb.getPublicArticles();
    },
    {
      enabled,
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
    }
  );
};

/**
 * Get featured articles
 */
export const useFeaturedArticles = (enabled: boolean = true) => {
  return useQuery(
    ['featuredArticles'],
    async () => {
      return knowledgeDb.getFeaturedArticles();
    },
    {
      enabled,
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
    }
  );
};

/**
 * Search articles
 */
export const useSearchArticles = (query: string, enabled: boolean = true) => {
  return useQuery(
    ['searchArticles', query],
    async () => {
      return knowledgeDb.searchArticles(query);
    },
    {
      enabled: enabled && query.length > 0,
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    }
  );
};

/**
 * Get articles by tags
 */
export const useArticlesByTags = (tags: string[], enabled: boolean = true) => {
  return useQuery(
    ['articlesByTags', JSON.stringify(tags)],
    async () => {
      return knowledgeDb.getArticlesByTags(tags);
    },
    {
      enabled: enabled && tags.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

/**
 * Get all categories
 */
export const useCategories = (enabled: boolean = true) => {
  return useQuery(
    ['categories'],
    async () => {
      return knowledgeDb.getAllCategories();
    },
    {
      enabled,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    }
  );
};

/**
 * Get subcategories
 */
export const useSubcategories = (parentId: string, enabled: boolean = true) => {
  return useQuery(
    ['subcategories', parentId],
    async () => {
      return knowledgeDb.getSubcategories(parentId);
    },
    {
      enabled: enabled && parentId.length > 0,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    }
  );
};

/**
 * Get article comments
 */
export const useArticleComments = (articleId: string, enabled: boolean = true) => {
  return useQuery(
    ['articleComments', articleId],
    async () => {
      return knowledgeDb.getArticleComments(articleId);
    },
    {
      enabled: enabled && articleId.length > 0,
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    }
  );
};

/**
 * Get reading progress
 */
export const useReadingProgress = (
  userId: string,
  articleId: string,
  enabled: boolean = true
) => {
  return useQuery(
    ['readingProgress', userId, articleId],
    async () => {
      return knowledgeDb.getReadingProgress(userId, articleId);
    },
    {
      enabled: enabled && userId.length > 0 && articleId.length > 0,
      staleTime: 1000 * 60, // 1 minute
      cacheTime: 1000 * 60 * 5, // 5 minutes
    }
  );
};

/**
 * Get bookmarked articles
 */
export const useBookmarkedArticles = (userId: string, enabled: boolean = true) => {
  return useQuery(
    ['bookmarkedArticles', userId],
    async () => {
      return knowledgeDb.getBookmarkedArticles(userId);
    },
    {
      enabled: enabled && userId.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

/**
 * Get article templates by category
 */
export const useTemplatesByCategory = (categoryId: string, enabled: boolean = true) => {
  return useQuery(
    ['templatesByCategory', categoryId],
    async () => {
      return knowledgeDb.getTemplatesByCategory(categoryId);
    },
    {
      enabled: enabled && categoryId.length > 0,
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
    }
  );
};

/**
 * Get knowledge collections
 */
export const useKnowledgeCollections = (userId: string, enabled: boolean = true) => {
  return useQuery(
    ['knowledgeCollections', userId],
    async () => {
      return knowledgeDb.getUserCollections(userId);
    },
    {
      enabled: enabled && userId.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

/**
 * Get onboarding guides by role
 */
export const useOnboardingGuides = (role: string, enabled: boolean = true) => {
  return useQuery(
    ['onboardingGuides', role],
    async () => {
      return knowledgeDb.getOnboardingGuidesByRole(role);
    },
    {
      enabled: enabled && role.length > 0,
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 120, // 2 hours
    }
  );
};

/**
 * Get knowledge base statistics
 */
export const useKnowledgeStats = (enabled: boolean = true) => {
  return useQuery(
    ['knowledgeStats'],
    async () => {
      return knowledgeDb.getKnowledgeStats();
    },
    {
      enabled,
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
    }
  );
};

// ==================== Mutation Hooks ====================

/**
 * Create a new article
 */
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (article: Article) => {
      return knowledgeDb.saveArticle(article);
    },
    {
      onSuccess: (_: any, variables: Article) => {
        queryClient.invalidateQueries(['publishedArticles']);
        queryClient.invalidateQueries(['articlesByCategory', variables.categoryId]);
      },
    }
  );
};

/**
 * Update an article
 */
export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Article>;
    }) => {
      return knowledgeDb.updateArticle(id, updates);
    },
    {
      onSuccess: (_: any, { id, updates }: { id: string; updates: Partial<Article> }) => {
        queryClient.invalidateQueries(['article', id]);
        queryClient.invalidateQueries(['publishedArticles']);
        queryClient.invalidateQueries(['featuredArticles']);
        if (updates.categoryId) {
          queryClient.invalidateQueries(['articlesByCategory', updates.categoryId]);
        }
      },
    }
  );
};

/**
 * Delete an article
 */
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      return knowledgeDb.deleteArticle(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['publishedArticles']);
        queryClient.invalidateQueries(['featuredArticles']);
      },
    }
  );
};

/**
 * Add a comment to an article
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (comment: ArticleComment) => {
      return knowledgeDb.saveComment(comment);
    },
    {
      onSuccess: (_: any, variables: ArticleComment) => {
        queryClient.invalidateQueries(['articleComments', variables.articleId]);
      },
    }
  );
};

/**
 * Update a comment
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ArticleComment>;
    }) => {
      return knowledgeDb.updateComment(id, updates);
    },
    {
      onSuccess: (_: any, variables: { id: string; updates: Partial<ArticleComment> }) => {
        // Get the comment to find its article ID
        queryClient.invalidateQueries(['articleComments']);
      },
    }
  );
};

/**
 * Resolve a comment
 */
export const useResolveComment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({
      id,
      resolvedBy,
    }: {
      id: string;
      resolvedBy: string;
    }) => {
      return knowledgeDb.resolveComment(id, resolvedBy);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['articleComments']);
      },
    }
  );
};

/**
 * Save reading progress
 */
export const useSaveReadingProgress = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (progress: ReadingProgress) => {
      return knowledgeDb.saveReadingProgress(progress);
    },
    {
      onSuccess: (_: any, variables: ReadingProgress) => {
        queryClient.invalidateQueries([
          'readingProgress',
          variables.userId,
          variables.articleId,
        ]);
      },
    }
  );
};

/**
 * Update reading progress
 */
export const useUpdateReadingProgress = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ReadingProgress>;
    }) => {
      return knowledgeDb.updateReadingProgress(id, updates);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['readingProgress']);
      },
    }
  );
};

/**
 * Toggle article bookmark
 */
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({
      userId,
      articleId,
    }: {
      userId: string;
      articleId: string;
    }) => {
      return knowledgeDb.toggleBookmark(userId, articleId);
    },
    {
      onSuccess: (_: any, variables: { userId: string; articleId: string }) => {
        queryClient.invalidateQueries([
          'readingProgress',
          variables.userId,
          variables.articleId,
        ]);
        queryClient.invalidateQueries([
          'bookmarkedArticles',
          variables.userId,
        ]);
      },
    }
  );
};

/**
 * Submit article feedback
 */
export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (feedback: ArticleFeedback) => {
      return knowledgeDb.saveFeedback(feedback);
    },
    {
      onSuccess: (_: any, variables: ArticleFeedback) => {
        queryClient.invalidateQueries(['article', variables.articleId]);
      },
    }
  );
};

/**
 * Create a knowledge collection
 */
export const useCreateKnowledgeCollection = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (collection: KnowledgeCollection) => {
      return knowledgeDb.saveCollection(collection);
    },
    {
      onSuccess: (_: any, variables: KnowledgeCollection) => {
        queryClient.invalidateQueries([
          'knowledgeCollections',
          variables.createdBy,
        ]);
      },
    }
  );
};

/**
 * Increment article view count
 */
export const useIncrementViewCount = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (articleId: string) => {
      return knowledgeDb.incrementArticleViewCount(articleId);
    },
    {
      onSuccess: (_: any, articleId: string) => {
        queryClient.invalidateQueries(['article', articleId]);
        queryClient.invalidateQueries(['knowledgeStats']);
      },
    }
  );
};
