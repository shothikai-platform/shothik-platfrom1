// ============================================
// Writing Studio - Project Service
// Manages long-form writing projects
// ============================================

import { 
  Project, 
  Chapter, 
  Version,
  IProjectService,
  IChapterService,
  ICacheService 
} from '../../../shared/types';

export interface CreateProjectRequest {
  userId: string;
  title: string;
  type: 'assignment' | 'book' | 'blog' | 'marketing' | 'research';
  description?: string;
  template?: string;
}

export interface CreateChapterRequest {
  projectId: string;
  title: string;
  order?: number;
}

export class StudioProjectService implements IProjectService {
  constructor(
    private db: any, // Convex database
    private cacheService: ICacheService
  ) {}

  async createProject(request: CreateProjectRequest): Promise<Project> {
    const project: Project = {
      id: this.generateId(),
      userId: request.userId,
      title: request.title,
      type: request.type,
      description: request.description || '',
      status: 'draft',
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    await this.db.insert('projects', project);

    // Create default chapters based on template
    if (request.template) {
      await this.applyTemplate(project.id, request.template);
    }

    return project;
  }

  async getProject(projectId: string): Promise<Project> {
    // Check cache first
    const cached = await this.cacheService.get<Project>(`project:${projectId}`);
    if (cached) return cached;

    // Fetch from database
    const project = await this.db.query('projects')
      .filter(q => q.eq('id', projectId))
      .first();

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch chapters
    project.chapters = await this.db.query('chapters')
      .filter(q => q.eq('projectId', projectId))
      .order('order')
      .collect();

    // Cache result
    await this.cacheService.set(`project:${projectId}`, project, 300); // 5 min cache

    return project;
  }

  async updateProject(
    projectId: string, 
    updates: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Project> {
    const project = await this.getProject(projectId);
    
    const updated = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };

    await this.db.update('projects', projectId, updated);
    
    // Invalidate cache
    await this.cacheService.delete(`project:${projectId}`);

    return updated;
  }

  async deleteProject(projectId: string): Promise<void> {
    // Delete all chapters first
    const chapters = await this.db.query('chapters')
      .filter(q => q.eq('projectId', projectId))
      .collect();
    
    for (const chapter of chapters) {
      await this.db.delete('chapters', chapter.id);
    }

    // Delete project
    await this.db.delete('projects', projectId);
    
    // Invalidate cache
    await this.cacheService.delete(`project:${projectId}`);
  }

  async listUserProjects(userId: string): Promise<Project[]> {
    return await this.db.query('projects')
      .filter(q => q.eq('userId', userId))
      .order('updatedAt', 'desc')
      .collect();
  }

  async duplicateProject(projectId: string, newTitle: string): Promise<Project> {
    const original = await this.getProject(projectId);
    
    const duplicate = await this.createProject({
      userId: original.userId,
      title: newTitle,
      type: original.type,
      description: original.description,
    });

    // Duplicate chapters
    for (const chapter of original.chapters) {
      await this.createChapter({
        projectId: duplicate.id,
        title: chapter.title,
        order: chapter.order,
      });
    }

    return duplicate;
  }

  private async applyTemplate(projectId: string, template: string): Promise<void> {
    const templates: Record<string, string[]> = {
      'assignment': ['Introduction', 'Main Body', 'Conclusion', 'References'],
      'book': ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'],
      'blog': ['Introduction', 'Main Points', 'Conclusion', 'Call to Action'],
      'research': ['Abstract', 'Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion'],
      'marketing': ['Hook', 'Problem', 'Solution', 'Benefits', 'CTA'],
    };

    const chapters = templates[template] || templates['assignment'];
    
    for (let i = 0; i < chapters.length; i++) {
      await this.createChapter({
        projectId,
        title: chapters[i],
        order: i,
      });
    }
  }

  private generateId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Chapter operations
  private async createChapter(request: CreateChapterRequest): Promise<Chapter> {
    const chapter: Chapter = {
      id: this.generateChapterId(),
      projectId: request.projectId,
      title: request.title,
      content: '',
      order: request.order || 0,
      versions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insert('chapters', chapter);
    return chapter;
  }

  private generateChapterId(): string {
    return `chap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================
// Chapter Service
// ============================================

export class StudioChapterService implements IChapterService {
  constructor(
    private db: any,
    private cacheService: ICacheService
  ) {}

  async updateContent(chapterId: string, content: string): Promise<Chapter> {
    const chapter = await this.getChapter(chapterId);
    
    // Auto-save version every 5 minutes or on significant changes
    const shouldSaveVersion = this.shouldSaveVersion(chapter, content);
    
    if (shouldSaveVersion) {
      await this.saveVersion(chapterId);
    }

    const updated = {
      ...chapter,
      content,
      updatedAt: new Date(),
    };

    await this.db.update('chapters', chapterId, updated);
    
    // Invalidate caches
    await this.cacheService.delete(`chapter:${chapterId}`);
    await this.cacheService.delete(`project:${chapter.projectId}`);

    return updated;
  }

  async saveVersion(chapterId: string): Promise<Version> {
    const chapter = await this.getChapter(chapterId);
    
    const version: Version = {
      id: this.generateVersionId(),
      chapterId,
      content: chapter.content,
      createdAt: new Date(),
    };

    await this.db.insert('versions', version);

    // Keep only last 50 versions
    await this.cleanupOldVersions(chapterId);

    return version;
  }

  async getVersionHistory(chapterId: string): Promise<Version[]> {
    return await this.db.query('versions')
      .filter(q => q.eq('chapterId', chapterId))
      .order('createdAt', 'desc')
      .collect();
  }

  async restoreVersion(chapterId: string, versionId: string): Promise<Chapter> {
    const version = await this.db.query('versions')
      .filter(q => q.eq('id', versionId))
      .first();

    if (!version) {
      throw new Error('Version not found');
    }

    // Save current state before restoring
    await this.saveVersion(chapterId);

    // Restore version
    return this.updateContent(chapterId, version.content);
  }

  async reorderChapters(projectId: string, chapterIds: string[]): Promise<void> {
    for (let i = 0; i < chapterIds.length; i++) {
      await this.db.update('chapters', chapterIds[i], { order: i });
    }
    
    // Invalidate project cache
    await this.cacheService.delete(`project:${projectId}`);
  }

  private async getChapter(chapterId: string): Promise<Chapter> {
    const cached = await this.cacheService.get<Chapter>(`chapter:${chapterId}`);
    if (cached) return cached;

    const chapter = await this.db.query('chapters')
      .filter(q => q.eq('id', chapterId))
      .first();

    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // Fetch versions
    chapter.versions = await this.db.query('versions')
      .filter(q => q.eq('chapterId', chapterId))
      .order('createdAt', 'desc')
      .limit(10)
      .collect();

    await this.cacheService.set(`chapter:${chapterId}`, chapter, 300);

    return chapter;
  }

  private shouldSaveVersion(chapter: Chapter, newContent: string): boolean {
    // Save version if:
    // 1. Content changed significantly (>100 chars difference)
    // 2. Last version was saved >5 minutes ago
    
    const contentDiff = Math.abs(newContent.length - chapter.content.length);
    if (contentDiff < 100) return false;

    const lastVersion = chapter.versions[0];
    if (!lastVersion) return true;

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return new Date(lastVersion.createdAt).getTime() < fiveMinutesAgo;
  }

  private async cleanupOldVersions(chapterId: string): Promise<void> {
    const versions = await this.db.query('versions')
      .filter(q => q.eq('chapterId', chapterId))
      .order('createdAt', 'desc')
      .collect();

    if (versions.length > 50) {
      const toDelete = versions.slice(50);
      for (const version of toDelete) {
        await this.db.delete('versions', version.id);
      }
    }
  }

  private generateVersionId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
