/**
 * Knowledge Base Module Type Definitions
 * Types for articles, categories, comments, and knowledge management
 */

// ==================== Article Types ====================

export type ArticleStatus = 'draft' | 'published' | 'archived' | 'review';
export type ArticleVisibility = 'private' | 'team' | 'organization' | 'public';
export type EditorMode = 'view' | 'edit' | 'preview';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML content
  summary: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  contributors: {
    id: string;
    name: string;
    email: string;
    role: 'editor' | 'reviewer' | 'translator';
  }[];
  status: ArticleStatus;
  visibility: ArticleVisibility;
  categoryId: string;
  subcategoryIds: string[];
  tags: string[];
  version: number;
  versionHistory: ArticleVersion[];
  createdAt: number;
  modifiedAt: number;
  publishedAt?: number;
  archivedAt?: number;
  metadata: ArticleMetadata;
  seo: ArticleSEO;
  relatedArticleIds: string[];
  attachments: {
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  embeddedContent: EmbeddedContent[];
  readingTime: number; // In minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
}

export interface ArticleMetadata {
  viewCount: number;
  helpfulCount: number;
  unhelpfulCount: number;
  shareCount: number;
  commentCount: number;
  averageRating: number; // 0-5
  isPopular: boolean;
  isFeatured: boolean;
  featuredPosition?: number;
  needsReview: boolean;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'as_needed';
  lastReviewedAt?: number;
  lastReviewedBy?: string;
  maintenanceStatus: 'current' | 'outdated' | 'needs_update';
}

export interface ArticleSEO {
  metaTitle: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords: string[];
}

export interface ArticleVersion {
  versionNumber: number;
  title: string;
  summary: string;
  author: string;
  timestamp: number;
  changesSummary: string;
  isCurrentVersion: boolean;
  contentSnapshot: string; // First 500 chars
}

// ==================== Category Types ====================

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId?: string;
  icon?: string;
  color?: string;
  position: number;
  articleCount: number;
  subcategoryCount: number;
  createdAt: number;
  modifiedAt: number;
  visibility: ArticleVisibility;
  metadata: {
    viewCount: number;
    articleViews: number;
    isPopular: boolean;
  };
}

// ==================== Comments & Feedback ====================

export interface ArticleComment {
  id: string;
  articleId: string;
  parentCommentId?: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  type: 'comment' | 'question' | 'suggestion' | 'issue';
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
  mentions: string[];
  createdAt: number;
  modifiedAt: number;
  likeCount: number;
  replies: ArticleComment[];
}

export interface ArticleFeedback {
  id: string;
  articleId: string;
  userId: string;
  helpful: boolean;
  rating: number; // 1-5
  comment?: string;
  timestamp: number;
}

// ==================== Reading Progress ====================

export interface ReadingProgress {
  id: string;
  userId: string;
  articleId: string;
  progress: number; // 0-100
  lastReadAt: number;
  totalReadTime: number; // In seconds
  bookmarked: boolean;
  bookmarkedAt?: number;
  highlightedSections: {
    startOffset: number;
    endOffset: number;
    color: string;
    timestamp: number;
  }[];
  notes: {
    id: string;
    offset: number;
    content: string;
    timestamp: number;
  }[];
}

// ==================== Templates ====================

export interface KnowledgeTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  structure: {
    sections: TemplateSection[];
    suggestedTags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  createdBy: string;
  createdAt: number;
  usageCount: number;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'table' | 'embed';
  placeholder: string;
  required: boolean;
  position: number;
}

// ==================== Embedded Content ====================

export interface EmbeddedContent {
  id: string;
  type: 'image' | 'video' | 'code' | 'chart' | 'search_result' | 'live_data' | 'iframe';
  title?: string;
  url: string;
  caption?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
  createdAt: number;
}

// ==================== Search Within KB ====================

export interface KnowledgeSearchOptions {
  query: string;
  categoryId?: string;
  includeArchived: boolean;
  includePrivate: boolean;
  language?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  sortBy: 'relevance' | 'recent' | 'popular' | 'rating';
}

// ==================== Knowledge Collections ====================

export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  articleIds: string[];
  categoryId?: string;
  createdBy: string;
  createdAt: number;
  isPublic: boolean;
  viewCount: number;
  sharedWith?: {
    userId: string;
    permission: 'view' | 'edit';
  }[];
}

// ==================== Onboarding Content ====================

export interface OnboardingGuide {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  targetRole?: string;
  estimatedTime: number; // In minutes
  articles: string[]; // Related article IDs
  quizzes: OnboardingQuiz[];
  completionBadge?: string;
  createdAt: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string; // Component or module to interact with
  tips: string[];
  videoUrl?: string;
  articleId?: string;
  completed?: boolean;
}

export interface OnboardingQuiz {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  relatedArticleId?: string;
}

// ==================== UI State ====================

export interface KnowledgeUIState {
  currentArticleId: string | null;
  currentCategoryId: string | null;
  editorMode: EditorMode;
  searchQuery: string;
  selectedCategoryIds: string[];
  viewMode: 'list' | 'grid' | 'card';
  showTableOfContents: boolean;
  showRelatedArticles: boolean;
  showComments: boolean;
  expandedComments: string[];
  selectedTemplate?: string;
  showTemplateModal: boolean;
  showCollectionModal: boolean;
  readingProgressVisible: boolean;
}

export interface ArticleEditorState {
  title: string;
  content: string;
  summary: string;
  categoryId: string;
  subcategoryIds: string[];
  tags: string[];
  status: ArticleStatus;
  visibility: ArticleVisibility;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isDirty: boolean;
  lastSavedAt?: number;
  autoSaveEnabled: boolean;
  showPreview: boolean;
}

// ==================== Table of Contents ====================

export interface TableOfContents {
  id: string;
  articleId: string;
  headings: TableOfContentsItem[];
  generatedAt: number;
  autoGenerated: boolean;
}

export interface TableOfContentsItem {
  id: string;
  level: number; // 1-6 for h1-h6
  title: string;
  anchor: string; // HTML id for linking
  children: TableOfContentsItem[];
}

// ==================== Knowledge Analytics ====================

export interface KnowledgeAnalytics {
  totalArticles: number;
  draftArticles: number;
  publishedArticles: number;
  archivedArticles: number;
  totalViews: number;
  averageRating: number;
  mostViewedArticles: {
    articleId: string;
    title: string;
    views: number;
  }[];
  mostHelpfulArticles: {
    articleId: string;
    title: string;
    helpfulRating: number;
  }[];
  articlesNeedingUpdate: {
    articleId: string;
    title: string;
    lastReviewedAt: number;
  }[];
  trendingTopics: {
    tag: string;
    viewCount: number;
    trending: boolean;
  }[];
}

// ==================== API Types ====================

export interface KnowledgeArticleResponse {
  article: Article;
  relatedArticles: Article[];
  nextArticle?: Article;
  previousArticle?: Article;
  breadcrumbs: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export interface KnowledgeListResponse {
  articles: Article[];
  total: number;
  hasMore: boolean;
  categories: KnowledgeCategory[];
}

// ==================== WebSocket Message Types ====================

export interface KnowledgeNotificationMessage {
  type: 'article_updated' | 'article_published' | 'comment_added' | 'article_shared' | 'feedback_received';
  articleId: string;
  data: any;
  timestamp: number;
}

// ==================== Knowledge Events ====================

export interface KnowledgeEvent {
  id: string;
  userId: string;
  type: 'view' | 'create' | 'edit' | 'publish' | 'comment' | 'rate' | 'share' | 'bookmark';
  articleId: string;
  timestamp: number;
  metadata: Record<string, any>;
}
