/**
 * Knowledge Base Module (Main Component)
 * WYSIWYG editor, article viewer, and knowledge hub
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Badge,
  Spinner,
  TabList,
  Tab,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
} from '@fluentui/react-components';
import {
  Edit20Regular,
  Save20Regular,
  PreviewLink20Regular,
  Share20Regular,
  Bookmark20Regular,
  CommentRegular,
  ChevronLeft20Regular,
} from '@fluentui/react-icons';
import { useKnowledgeStore, useArticleEditorStore } from '../store/knowledgeStore';
import {
  useArticle,
  useCategories,
  usePublishedArticles,
  useUpdateArticle,
} from '../hooks/useKnowledgeData';
import '../styles/knowledge.css';

interface KnowledgeProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export const Knowledge: React.FC<KnowledgeProps> = () => {
  const [tabValue, setTabValue] = useState<string>('articles');

  const knowledgeStore = useKnowledgeStore();
  const editorStore = useArticleEditorStore();

  // Data hooks
  const { data: categories } = useCategories();
  const { data: articles } = usePublishedArticles();
  const { data: currentArticle } = useArticle(knowledgeStore.currentArticleId || '', !!knowledgeStore.currentArticleId);
  const updateArticleMutation = useUpdateArticle();

  // Filtered articles based on search
  const filteredArticles = useMemo(() => {
    if (!articles) return [];

    let results = [...articles];

    // Filter by search query
    if (knowledgeStore.searchQuery) {
      const query = knowledgeStore.searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.tags.some((t: string) => t.toLowerCase().includes(query))
      );
    }

    // Filter by categories
    if (knowledgeStore.selectedCategoryIds.length > 0) {
      results = results.filter((a) =>
        knowledgeStore.selectedCategoryIds.includes(a.categoryId)
      );
    }

    return results;
  }, [articles, knowledgeStore.searchQuery, knowledgeStore.selectedCategoryIds]);

  const handleBackToList = useCallback(() => {
    knowledgeStore.setCurrentArticleId(null);
    knowledgeStore.setEditorMode('view');
    editorStore.reset();
  }, [knowledgeStore, editorStore]);

  const handleEditArticle = useCallback(() => {
    if (currentArticle) {
      editorStore.setTitle(currentArticle.title);
      editorStore.setContent(currentArticle.content);
      editorStore.setSummary(currentArticle.summary);
      editorStore.setCategoryId(currentArticle.categoryId);
      knowledgeStore.setEditorMode('edit');
    }
  }, [currentArticle, editorStore, knowledgeStore]);

  const handleSaveArticle = useCallback(() => {
    if (knowledgeStore.currentArticleId) {
      updateArticleMutation.mutate({
        id: knowledgeStore.currentArticleId,
        updates: {
          title: editorStore.title,
          content: editorStore.content,
          summary: editorStore.summary,
          categoryId: editorStore.categoryId,
          tags: editorStore.tags,
          status: editorStore.status,
          visibility: editorStore.visibility,
          modifiedAt: Date.now(),
        } as any,
      });
      knowledgeStore.setEditorMode('view');
    }
  }, [knowledgeStore.currentArticleId, updateArticleMutation, editorStore, knowledgeStore]);

  const handleToggleBookmark = useCallback(() => {
    // Implement bookmark toggle
  }, []);

  return (
    <div className='knowledge-container'>
      {/* Header */}
      <div className='knowledge-header'>
        <div className='knowledge-title'>
          <h1>Knowledge Base</h1>
          <p>Comprehensive guides, tutorials, and documentation</p>
        </div>

        <Button appearance='primary' onClick={() => knowledgeStore.setShowTemplateModal(true)}>
          Create Article
        </Button>
      </div>

      {!knowledgeStore.currentArticleId ? (
        // List View
        <div className='knowledge-layout'>
          {/* Sidebar: Categories */}
          <div className='knowledge-sidebar'>
            <div className='sidebar-section'>
              <h3>Categories</h3>
              <div className='category-list'>
                {categories?.map((category: any) => (
                  <div
                    key={category.id}
                    className={`category-item ${
                      knowledgeStore.selectedCategoryIds.includes(category.id) ? 'selected' : ''
                    }`}
                    onClick={() => knowledgeStore.toggleCategorySelection(category.id)}
                  >
                    <span className='category-name'>{category.name}</span>
                    <Badge className='article-count'>{category.articleCount}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className='sidebar-section'>
              <h3>Difficulty</h3>
              <div className='difficulty-list'>
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <label key={level} className='difficulty-checkbox'>
                    <input type='checkbox' />
                    <span className='difficulty-label'>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main: Articles List */}
          <div className='knowledge-main'>
            <TabList selectedValue={tabValue} onTabSelect={(_: any, data: any) => setTabValue(data.value)} className='knowledge-tabs'>
              <Tab value='articles'>Articles</Tab>
              <Tab value='search'>Search Within KB</Tab>
              <Tab value='trending'>Trending</Tab>
            </TabList>

            {/* Search Bar */}
            <div className='knowledge-search-bar'>
              <input
                type='text'
                placeholder='Search articles...'
                value={knowledgeStore.searchQuery}
                onChange={(e) => knowledgeStore.setSearchQuery(e.target.value)}
                className='search-input'
              />
            </div>

            {/* View Mode Toggle */}
            <div className='view-mode-selector'>
              {(['list', 'grid', 'card'] as const).map((mode) => (
                <Button
                  key={mode}
                  onClick={() => knowledgeStore.setViewMode(mode)}
                  appearance={knowledgeStore.viewMode === mode ? 'primary' : 'subtle'}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>

            {/* Articles Grid/List */}
            <div className={`articles-${knowledgeStore.viewMode}`}>
              {filteredArticles.length === 0 ? (
                <div className='empty-state'>
                  <p>No articles found</p>
                  <p className='empty-description'>
                    Try different keywords or select different categories
                  </p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className='article-card'
                    onClick={() => {
                      knowledgeStore.setCurrentArticleId(article.id);
                      knowledgeStore.setEditorMode('view');
                    }}
                  >
                    <div className='article-card-header'>
                      <h3 className='article-title'>{article.title}</h3>
                      <Badge className='difficulty-badge'>{article.difficulty}</Badge>
                    </div>

                    <p className='article-summary'>{article.summary}</p>

                    <div className='article-card-meta'>
                      <span className='reading-time'>{article.readingTime} min read</span>
                      <span className='view-count'>{article.metadata.viewCount} views</span>
                      <div className='article-rating'>
                        ⭐ {article.metadata.averageRating.toFixed(1)}
                      </div>
                    </div>

                    <div className='article-tags'>
                      {article.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} className='tag-badge'>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className='article-footer'>
                      <span className='author'>By {article.author.name}</span>
                      <span className='modified-date'>
                        {new Date(article.modifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Article Detail View
        <div className='article-detail-view'>
          <div className='article-detail-header'>
            <Button
              icon={ChevronLeft20Regular as any}
              onClick={handleBackToList}
              appearance='subtle'
            >
              Back
            </Button>

            {currentArticle && (
              <Breadcrumb className='article-breadcrumb'>
                <BreadcrumbItem>
                  <button onClick={handleBackToList}>Articles</button>
                </BreadcrumbItem>
                <BreadcrumbDivider />
                <BreadcrumbItem>{currentArticle.title}</BreadcrumbItem>
              </Breadcrumb>
            )}

            <div className='article-detail-actions'>
              {knowledgeStore.editorMode === 'view' && (
                <>
                  <Button
                    icon={Edit20Regular as any}
                    onClick={handleEditArticle}
                    appearance='subtle'
                  >
                    Edit
                  </Button>
                  <Button
                    icon={Bookmark20Regular as any}
                    onClick={handleToggleBookmark}
                    appearance='subtle'
                  >
                    Bookmark
                  </Button>
                  <Button icon={Share20Regular as any} appearance='subtle'>
                    Share
                  </Button>
                </>
              )}

              {knowledgeStore.editorMode === 'edit' && (
                <>
                  <Button
                    icon={PreviewLink20Regular as any}
                    onClick={() => knowledgeStore.setEditorMode('preview')}
                    appearance='subtle'
                  >
                    Preview
                  </Button>
                  <Button
                    icon={Save20Regular as any}
                    onClick={handleSaveArticle}
                    appearance='primary'
                  >
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {currentArticle ? (
            knowledgeStore.editorMode === 'view' ? (
              // Article Viewer
              <div className='article-viewer'>
                <div className='article-viewer-header'>
                  <h1>{currentArticle.title}</h1>
                  <div className='article-meta'>
                    <span>By {currentArticle.author.name}</span>
                    <span className='meta-divider'>•</span>
                    <span>{new Date(currentArticle.modifiedAt).toLocaleDateString()}</span>
                    <span className='meta-divider'>•</span>
                    <span>{currentArticle.readingTime} min read</span>
                  </div>
                </div>

                <div className='article-content'>{currentArticle.content}</div>

                {currentArticle.metadata.isFeatured && (
                  <div className='featured-badge'>Featured Article</div>
                )}

                {/* Comments Section */}
                {knowledgeStore.showComments && (
                  <div className='comments-section'>
                    <h3>
                      {CommentRegular as any} Comments
                    </h3>
                    <div className='comments-list'>
                      {/* Comments would be rendered here */}
                      <p className='empty-comments'>No comments yet</p>
                    </div>
                  </div>
                )}

                {/* Related Articles */}
                {knowledgeStore.showRelatedArticles && (
                  <div className='related-articles'>
                    <h3>Related Articles</h3>
                    <div className='related-list'>
                      {/* Related articles would be rendered here */}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Article Editor / Preview
              <div className='article-editor'>
                {knowledgeStore.editorMode === 'edit' ? (
                  <div className='editor-form'>
                    <div className='form-group'>
                      <label>Title</label>
                      <input
                        type='text'
                        value={editorStore.title}
                        onChange={(e) => editorStore.setTitle(e.target.value)}
                        className='form-input'
                      />
                    </div>

                    <div className='form-group'>
                      <label>Summary</label>
                      <textarea
                        value={editorStore.summary}
                        onChange={(e) => editorStore.setSummary(e.target.value)}
                        rows={3}
                        className='form-textarea'
                      />
                    </div>

                    <div className='form-group'>
                      <label>Content</label>
                      <textarea
                        value={editorStore.content}
                        onChange={(e) => editorStore.setContent(e.target.value)}
                        rows={15}
                        className='form-textarea'
                      />
                    </div>

                    <div className='form-row'>
                      <div className='form-group'>
                        <label>Category</label>
                        <select value={editorStore.categoryId} onChange={(e) => editorStore.setCategoryId(e.target.value)}>
                          <option value=''>Select category</option>
                          {categories?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className='form-group'>
                        <label>Difficulty</label>
                        <select
                          value={editorStore.difficulty}
                          onChange={(e) =>
                            editorStore.setDifficulty(
                              e.target.value as 'beginner' | 'intermediate' | 'advanced'
                            )
                          }
                        >
                          <option value='beginner'>Beginner</option>
                          <option value='intermediate'>Intermediate</option>
                          <option value='advanced'>Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Preview mode
                  <div className='article-preview'>
                    <h1>{editorStore.title}</h1>
                    <p className='preview-summary'>{editorStore.summary}</p>
                    <div className='preview-content'>{editorStore.content}</div>
                  </div>
                )}
              </div>
            )
          ) : (
            <Spinner label='Loading article...' />
          )}
        </div>
      )}
    </div>
  );
};

export default Knowledge;
