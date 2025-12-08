/**
 * Knowledge Base Database Service (Dexie)
 * Handles persistence of articles, categories, comments, and reading progress
 */

import Dexie, { Table } from 'dexie';
import {
  Article,
  KnowledgeCategory,
  ArticleComment,
  ReadingProgress,
  KnowledgeTemplate,
  KnowledgeCollection,
  OnboardingGuide,
  ArticleFeedback,
  KnowledgeEvent,
} from '../types/knowledge';

export class KnowledgeDatabase extends Dexie {
  articles!: Table<Article>;
  categories!: Table<KnowledgeCategory>;
  comments!: Table<ArticleComment>;
  readingProgress!: Table<ReadingProgress>;
  templates!: Table<KnowledgeTemplate>;
  collections!: Table<KnowledgeCollection>;
  onboardingGuides!: Table<OnboardingGuide>;
  feedback!: Table<ArticleFeedback>;
  events!: Table<KnowledgeEvent>;

  constructor() {
    super('FusionDeskKnowledge');
    this.version(1).stores({
      articles: 'id, slug, [author.id], status, visibility, [categoryId+status], modifiedAt',
      categories: 'id, slug, [parentCategoryId], position',
      comments: 'id, articleId, [articleId+createdAt], [author.id], resolved',
      readingProgress: 'id, [userId+articleId], userId, [articleId+lastReadAt]',
      templates: 'id, categoryId, [createdBy+createdAt]',
      collections: 'id, [createdBy+createdAt], isPublic',
      onboardingGuides: 'id, [targetRole]',
      feedback: 'id, [articleId+userId], [userId+timestamp], helpful',
      events: 'id, [userId+timestamp], type, articleId',
    });
  }

  // ==================== Articles ====================

  async saveArticle(article: Article): Promise<string> {
    return (await this.articles.add(article)) as any as string;
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    return this.articles.where('slug').equals(slug).first();
  }

  async getArticles(limit: number = 50): Promise<Article[]> {
    return this.articles.reverse().limit(limit).toArray();
  }

  async getArticlesByCategory(categoryId: string): Promise<Article[]> {
    return this.articles
      .where('[categoryId+status]')
      .between([categoryId, ''], [categoryId, '\uffff'])
      .filter((a) => a.status === 'published')
      .toArray();
  }

  async getArticlesByAuthor(authorId: string): Promise<Article[]> {
    return this.articles
      .where('author.id')
      .equals(authorId)
      .toArray();
  }

  async getArticlesByStatus(status: string): Promise<Article[]> {
    return this.articles
      .where('status')
      .equals(status)
      .toArray();
  }

  async getPublishedArticles(): Promise<Article[]> {
    return this.articles
      .where('status')
      .equals('published')
      .toArray();
  }

  async getPublicArticles(): Promise<Article[]> {
    return this.articles
      .where('visibility')
      .equals('public')
      .filter((a) => a.status === 'published')
      .toArray();
  }

  async searchArticles(query: string): Promise<Article[]> {
    const normalizedQuery = query.toLowerCase();
    return this.articles
      .filter((a) => 
        a.title.toLowerCase().includes(normalizedQuery) ||
        a.summary.toLowerCase().includes(normalizedQuery) ||
        a.tags.some((t) => t.toLowerCase().includes(normalizedQuery))
      )
      .toArray();
  }

  async getArticlesByTags(tags: string[]): Promise<Article[]> {
    const articles = await this.articles.toArray();
    return articles.filter((a) => tags.some((t) => a.tags.includes(t)));
  }

  async getRecentArticles(limit: number = 10): Promise<Article[]> {
    return this.articles
      .where('modifiedAt')
      .above(0)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getFeaturedArticles(): Promise<Article[]> {
    return this.articles
      .filter((a) => a.metadata.isFeatured && a.status === 'published')
      .reverse()
      .toArray();
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<void> {
    await this.articles.update(id, updates);
  }

  async incrementArticleViewCount(id: string): Promise<void> {
    const article = await this.getArticle(id);
    if (article) {
      article.metadata.viewCount += 1;
      await this.updateArticle(id, { metadata: article.metadata });
    }
  }

  async deleteArticle(id: string): Promise<void> {
    // Delete related comments and reading progress
    const comments = await this.comments.where('articleId').equals(id).toArray();
    await this.comments.bulkDelete(comments.map((c) => c.id));

    const progress = await this.readingProgress.where('articleId').equals(id).toArray();
    await this.readingProgress.bulkDelete(progress.map((p) => p.id));

    const feedback = await this.feedback.where('articleId').equals(id).toArray();
    await this.feedback.bulkDelete(feedback.map((f) => f.id));

    await this.articles.delete(id);
  }

  // ==================== Categories ====================

  async saveCategory(category: KnowledgeCategory): Promise<any> {
    return await this.categories.add(category);
  }

  async getCategory(id: string): Promise<KnowledgeCategory | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<KnowledgeCategory | undefined> {
    return this.categories.where('slug').equals(slug).first();
  }

  async getRootCategories(): Promise<KnowledgeCategory[]> {
    return this.categories
      .filter((c) => !c.parentCategoryId)
      .toArray();
  }

  async getSubcategories(parentCategoryId: string): Promise<KnowledgeCategory[]> {
    return this.categories
      .where('parentCategoryId')
      .equals(parentCategoryId)
      .toArray();
  }

  async getAllCategories(): Promise<KnowledgeCategory[]> {
    return this.categories.toArray();
  }

  async updateCategory(id: string, updates: Partial<KnowledgeCategory>): Promise<void> {
    await this.categories.update(id, updates) as any;
  }

  async deleteCategory(id: string): Promise<void> {
    // Move articles to parent category or archive
    const articles = await this.getArticlesByCategory(id);
    const category = await this.getCategory(id);

    for (const article of articles) {
      if (category?.parentCategoryId) {
        await this.updateArticle(article.id, { categoryId: category.parentCategoryId });
      }
    }

    return this.categories.delete(id);
  }

  // ==================== Comments ====================

  async saveComment(comment: ArticleComment): Promise<any> {
    return await this.comments.add(comment);
  }

  async getComment(id: string): Promise<ArticleComment | undefined> {
    return this.comments.get(id);
  }

  async getArticleComments(articleId: string): Promise<ArticleComment[]> {
    return this.comments
      .where('[articleId+createdAt]')
      .between([articleId, 0], [articleId, Date.now()])
      .reverse()
      .toArray();
  }

  async getUnresolvedComments(articleId: string): Promise<ArticleComment[]> {
    return this.comments
      .where('articleId')
      .equals(articleId)
      .filter((c) => !c.resolved)
      .toArray();
  }

  async getUserComments(userId: string): Promise<ArticleComment[]> {
    return this.comments
      .where('author.id')
      .equals(userId)
      .toArray();
  }

  async updateComment(id: string, updates: Partial<ArticleComment>): Promise<void> {
    await this.comments.update(id, updates) as any;
  }

  async resolveComment(id: string, resolvedBy: string): Promise<void> {
    await this.comments.update(id, {
      resolved: true,
      resolvedBy,
      resolvedAt: Date.now(),
    }) as any;
  }

  async deleteComment(id: string): Promise<void> {
    return this.comments.delete(id);
  }

  // ==================== Reading Progress ====================

  async saveReadingProgress(progress: ReadingProgress): Promise<any> {
    return await this.readingProgress.add(progress);
  }

  async getReadingProgress(userId: string, articleId: string): Promise<ReadingProgress | undefined> {
    return this.readingProgress
      .where('[userId+articleId]')
      .equals([userId, articleId])
      .first();
  }

  async getUserReadingProgress(userId: string): Promise<ReadingProgress[]> {
    return this.readingProgress
      .where('userId')
      .equals(userId)
      .toArray();
  }

  async updateReadingProgress(
    id: string,
    updates: Partial<ReadingProgress>
  ): Promise<void> {
    await this.readingProgress.update(id, updates) as any;
  }

  async getBookmarkedArticles(userId: string): Promise<Article[]> {
    const progress = await this.readingProgress
      .where('userId')
      .equals(userId)
      .filter((p) => p.bookmarked)
      .toArray();

    const articles = await Promise.all(
      progress.map((p) => this.getArticle(p.articleId))
    );

    return articles.filter((a) => a !== undefined) as Article[];
  }

  async toggleBookmark(userId: string, articleId: string): Promise<void> {
    let progress = await this.getReadingProgress(userId, articleId);

    if (!progress) {
      progress = {
        id: `progress_${userId}_${articleId}`,
        userId,
        articleId,
        progress: 0,
        lastReadAt: Date.now(),
        totalReadTime: 0,
        bookmarked: true,
        highlightedSections: [],
        notes: [],
      };
      await this.saveReadingProgress(progress);
    } else {
      await this.updateReadingProgress(progress.id, {
        bookmarked: !progress.bookmarked,
      });
    }
  }

  // ==================== Templates ====================

  async saveTemplate(template: KnowledgeTemplate): Promise<any> {
    return await this.templates.add(template);
  }

  async getTemplate(id: string): Promise<KnowledgeTemplate | undefined> {
    return this.templates.get(id);
  }

  async getTemplatesByCategory(categoryId: string): Promise<KnowledgeTemplate[]> {
    return this.templates
      .where('categoryId')
      .equals(categoryId)
      .toArray();
  }

  async getAllTemplates(): Promise<KnowledgeTemplate[]> {
    return this.templates.toArray();
  }

  async updateTemplate(id: string, updates: Partial<KnowledgeTemplate>): Promise<void> {
    await this.templates.update(id, updates) as any;
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.templates.delete(id);
  }

  // ==================== Collections ====================

  async saveCollection(collection: KnowledgeCollection): Promise<any> {
    return await this.collections.add(collection);
  }

  async getCollection(id: string): Promise<KnowledgeCollection | undefined> {
    return this.collections.get(id);
  }

  async getUserCollections(userId: string): Promise<KnowledgeCollection[]> {
    return this.collections
      .where('[createdBy+createdAt]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .toArray();
  }

  async getPublicCollections(): Promise<KnowledgeCollection[]> {
    const collections = await this.collections.toArray();
    return collections.filter((c) => c.isPublic);
  }

  async updateCollection(id: string, updates: Partial<KnowledgeCollection>): Promise<void> {
    await this.collections.update(id, updates) as any;
  }

  async deleteCollection(id: string): Promise<void> {
    await this.collections.delete(id) as any;
  }

  // ==================== Onboarding Guides ====================

  async saveOnboardingGuide(guide: OnboardingGuide): Promise<any> {
    return await this.onboardingGuides.add(guide);
  }

  async getOnboardingGuide(id: string): Promise<OnboardingGuide | undefined> {
    return this.onboardingGuides.get(id);
  }

  async getOnboardingGuidesByRole(role: string): Promise<OnboardingGuide[]> {
    return this.onboardingGuides
      .where('targetRole')
      .equals(role)
      .toArray();
  }

  async getAllOnboardingGuides(): Promise<OnboardingGuide[]> {
    return this.onboardingGuides.toArray();
  }

  async updateOnboardingGuide(id: string, updates: Partial<OnboardingGuide>): Promise<void> {
    await this.onboardingGuides.update(id, updates) as any;
  }

  // ==================== Feedback ====================

  async saveFeedback(feedback: ArticleFeedback): Promise<any> {
    return await this.feedback.add(feedback);
  }

  async getArticleFeedback(articleId: string): Promise<ArticleFeedback[]> {
    return this.feedback
      .where('articleId')
      .equals(articleId)
      .toArray();
  }

  async getUserFeedback(userId: string): Promise<ArticleFeedback[]> {
    return this.feedback
      .where('[userId+timestamp]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .toArray();
  }

  async getHelpfulFeedback(articleId: string): Promise<ArticleFeedback[]> {
    return this.feedback
      .where('articleId')
      .equals(articleId)
      .filter((f) => f.helpful)
      .toArray();
  }

  async deleteFeedback(id: string): Promise<void> {
    return this.feedback.delete(id);
  }

  // ==================== Events ====================

  async logEvent(event: KnowledgeEvent): Promise<any> {
    return await this.events.add(event);
  }

  async getArticleEvents(articleId: string): Promise<KnowledgeEvent[]> {
    return this.events
      .where('articleId')
      .equals(articleId)
      .reverse()
      .toArray();
  }

  async getUserEvents(userId: string, limit: number = 100): Promise<KnowledgeEvent[]> {
    return this.events
      .where('[userId+timestamp]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .limit(limit)
      .toArray();
  }

  // ==================== Utility Functions ====================

  async getAllData(): Promise<{
    articles: Article[];
    categories: KnowledgeCategory[];
    comments: ArticleComment[];
    readingProgress: ReadingProgress[];
    templates: KnowledgeTemplate[];
    collections: KnowledgeCollection[];
    onboardingGuides: OnboardingGuide[];
    feedback: ArticleFeedback[];
    events: KnowledgeEvent[];
  }> {
    return {
      articles: await this.articles.toArray(),
      categories: await this.categories.toArray(),
      comments: await this.comments.toArray(),
      readingProgress: await this.readingProgress.toArray(),
      templates: await this.templates.toArray(),
      collections: await this.collections.toArray(),
      onboardingGuides: await this.onboardingGuides.toArray(),
      feedback: await this.feedback.toArray(),
      events: await this.events.toArray(),
    };
  }

  async clearAllData(): Promise<void> {
    await this.delete();
    await this.open();
  }

  async getKnowledgeStats(): Promise<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
    averageRating: number;
    categoriesCount: number;
  }> {
    const articles = await this.articles.toArray();
    const categories = await this.categories.toArray();

    const publishedArticles = articles.filter((a) => a.status === 'published').length;
    const draftArticles = articles.filter((a) => a.status === 'draft').length;
    const totalViews = articles.reduce((sum, a) => sum + a.metadata.viewCount, 0);
    const averageRating =
      articles.length > 0
        ? articles.reduce((sum, a) => sum + a.metadata.averageRating, 0) / articles.length
        : 0;

    return {
      totalArticles: articles.length,
      publishedArticles,
      draftArticles,
      totalViews,
      averageRating,
      categoriesCount: categories.length,
    };
  }
}

export const knowledgeDb = new KnowledgeDatabase();
