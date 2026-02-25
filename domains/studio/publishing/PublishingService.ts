// ============================================
// Writing Studio - Publishing Service
// Export and publish content
// ============================================

import { ICacheService } from '../../../shared/types';

export interface ExportRequest {
  projectId: string;
  format: 'pdf' | 'docx' | 'txt' | 'md' | 'html';
  options?: ExportOptions;
}

export interface ExportOptions {
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
  fontSize?: number;
  fontFamily?: string;
  lineSpacing?: number;
  margins?: { top: number; right: number; bottom: number; left: number };
}

export interface PublishRequest {
  projectId: string;
  platform: 'medium' | 'wordpress' | 'ghost' | 'custom';
  settings?: PublishSettings;
}

export interface PublishSettings {
  title?: string;
  excerpt?: string;
  tags?: string[];
  featuredImage?: string;
  status?: 'draft' | 'published';
  schedule?: Date;
}

export class StudioPublishingService {
  constructor(
    private db: any,
    private cacheService: ICacheService,
    private storageService: any // For file storage
  ) {}

  // ============================================
  // Export Functions
  // ============================================

  async exportProject(request: ExportRequest): Promise<{ url: string; filename: string }> {
    const { projectId, format, options } = request;

    // Get project data
    const project = await this.getProjectWithChapters(projectId);

    // Generate content based on format
    let content: Buffer | string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'pdf':
        content = await this.generatePDF(project, options);
        filename = `${project.title}.pdf`;
        contentType = 'application/pdf';
        break;
      case 'docx':
        content = await this.generateDOCX(project, options);
        filename = `${project.title}.docx`;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'txt':
        content = this.generateTXT(project);
        filename = `${project.title}.txt`;
        contentType = 'text/plain';
        break;
      case 'md':
        content = this.generateMarkdown(project);
        filename = `${project.title}.md`;
        contentType = 'text/markdown';
        break;
      case 'html':
        content = this.generateHTML(project, options);
        filename = `${project.title}.html`;
        contentType = 'text/html';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Upload to storage
    const url = await this.storageService.upload({
      content,
      filename,
      contentType,
    });

    return { url, filename };
  }

  private async generatePDF(
    project: any, 
    options?: ExportOptions
  ): Promise<Buffer> {
    // Use a PDF generation library like pdfmake or puppeteer
    const fullText = this.compileProjectText(project);

    const docDefinition = {
      content: [
        { text: project.title, style: 'header' },
        ...(options?.includeTableOfContents ? [{ toc: { title: 'Table of Contents' } }] : []),
        ...project.chapters.map((ch: any) => [
          { text: ch.title, style: 'chapterTitle', pageBreak: 'before' },
          { text: ch.content, style: 'content' },
        ]),
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        chapterTitle: {
          fontSize: options?.fontSize ? options.fontSize + 4 : 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        content: {
          fontSize: options?.fontSize || 12,
          lineHeight: options?.lineSpacing || 1.5,
        },
      },
      pageMargins: options?.margins ? [
        options.margins.left,
        options.margins.top,
        options.margins.right,
        options.margins.bottom,
      ] : [40, 60, 40, 60],
    };

    // This would use pdfmake or similar
    // return pdfMake.createPdf(docDefinition).getBuffer();
    return Buffer.from(JSON.stringify(docDefinition)); // Placeholder
  }

  private async generateDOCX(
    project: any, 
    options?: ExportOptions
  ): Promise<Buffer> {
    // Use docx library
    const fullText = this.compileProjectText(project);
    
    // Placeholder - would use docx library
    return Buffer.from(fullText);
  }

  private generateTXT(project: any): string {
    const lines: string[] = [project.title, '', ''];
    
    for (const chapter of project.chapters) {
      lines.push(chapter.title);
      lines.push('');
      lines.push(chapter.content);
      lines.push('');
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateMarkdown(project: any): string {
    const lines: string[] = [`# ${project.title}`, '', ''];
    
    for (const chapter of project.chapters) {
      lines.push(`## ${chapter.title}`);
      lines.push('');
      lines.push(chapter.content);
      lines.push('');
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateHTML(project: any, options?: ExportOptions): string {
    const chaptersHTML = project.chapters
      .map((ch: any) => `
        <article class="chapter">
          <h2>${ch.title}</h2>
          <div class="content">${this.textToHTML(ch.content)}</div>
        </article>
      `)
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.title}</title>
  <style>
    body {
      font-family: ${options?.fontFamily || 'Georgia, serif'};
      font-size: ${options?.fontSize || 16}px;
      line-height: ${options?.lineSpacing || 1.6};
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { text-align: center; margin-bottom: 40px; }
    h2 { margin-top: 40px; page-break-before: always; }
    .chapter { margin-bottom: 60px; }
    .content { text-align: justify; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  ${chaptersHTML}
</body>
</html>
    `;
  }

  private textToHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  private compileProjectText(project: any): string {
    const parts: string[] = [project.title, ''];
    
    for (const chapter of project.chapters) {
      parts.push(chapter.title);
      parts.push('');
      parts.push(chapter.content);
      parts.push('');
    }

    return parts.join('\n');
  }

  // ============================================
  // Publishing Functions
  // ============================================

  async publishToPlatform(request: PublishRequest): Promise<{ url: string; status: string }> {
    const { projectId, platform, settings } = request;

    // Get project
    const project = await this.getProjectWithChapters(projectId);
    const content = this.compileProjectText(project);

    switch (platform) {
      case 'medium':
        return this.publishToMedium(project, content, settings);
      case 'wordpress':
        return this.publishToWordPress(project, content, settings);
      case 'ghost':
        return this.publishToGhost(project, content, settings);
      case 'custom':
        return this.publishToCustom(project, content, settings);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async publishToMedium(
    project: any, 
    content: string, 
    settings?: PublishSettings
  ): Promise<{ url: string; status: string }> {
    // Use Medium API
    // https://github.com/Medium/medium-api-docs
    
    const postData = {
      title: settings?.title || project.title,
      contentFormat: 'markdown',
      content: this.generateMarkdown(project),
      tags: settings?.tags || [],
      publishStatus: settings?.status === 'published' ? 'public' : 'draft',
    };

    // Placeholder - would call Medium API
    return {
      url: `https://medium.com/@user/${project.id}`,
      status: settings?.status || 'draft',
    };
  }

  private async publishToWordPress(
    project: any, 
    content: string, 
    settings?: PublishSettings
  ): Promise<{ url: string; status: string }> {
    // Use WordPress REST API
    
    const postData = {
      title: settings?.title || project.title,
      content: this.generateHTML(project),
      excerpt: settings?.excerpt,
      status: settings?.status === 'published' ? 'publish' : 'draft',
      tags: settings?.tags || [],
    };

    // Placeholder - would call WordPress API
    return {
      url: `https://user.wordpress.com/${project.id}`,
      status: settings?.status || 'draft',
    };
  }

  private async publishToGhost(
    project: any, 
    content: string, 
    settings?: PublishSettings
  ): Promise<{ url: string; status: string }> {
    // Use Ghost Admin API
    
    const postData = {
      title: settings?.title || project.title,
      html: this.generateHTML(project),
      excerpt: settings?.excerpt,
      status: settings?.status === 'published' ? 'published' : 'draft',
      tags: settings?.tags?.map((t: string) => ({ name: t })) || [],
    };

    // Placeholder - would call Ghost API
    return {
      url: `https://user.ghost.io/${project.id}`,
      status: settings?.status || 'draft',
    };
  }

  private async publishToCustom(
    project: any, 
    content: string, 
    settings?: PublishSettings
  ): Promise<{ url: string; status: string }> {
    // Webhook or custom integration
    
    return {
      url: settings?.settings?.customUrl || '',
      status: 'pending',
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async getProjectWithChapters(projectId: string): Promise<any> {
    const cacheKey = `project:${projectId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const project = await this.db.query('projects')
      .filter(q => q.eq('id', projectId))
      .first();

    if (!project) {
      throw new Error('Project not found');
    }

    project.chapters = await this.db.query('chapters')
      .filter(q => q.eq('projectId', projectId))
      .order('order')
      .collect();

    await this.cacheService.set(cacheKey, project, 300);
    return project;
  }
}
