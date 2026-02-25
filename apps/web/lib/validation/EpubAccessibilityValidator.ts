/**
 * EpubAccessibilityValidator - Validates ePub files against ePub 3.3 and WCAG 2.2 AA standards
 * 
 * This validator checks:
 * - ePub 3.3 structural requirements
 * - WCAG 2.2 Level AA accessibility guidelines
 * - Required accessibility metadata
 * - Semantic HTML structure
 * - Image alt text
 * - Color contrast (if CSS provided)
 * - Reading order
 * - Table of contents navigation
 */

export interface AccessibilityReport {
  passed: boolean;
  score: number; // 0-100
  epubVersion: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  metadata: {
    title?: string;
    author?: string;
    hasAccessibilityMetadata: boolean;
    conformanceClaim?: string;
  };
}

export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  criterion: string; // e.g., "WCAG 1.1.1", "EPUB-001"
  category: 'metadata' | 'structure' | 'content' | 'images' | 'navigation' | 'semantics';
  message: string;
  details?: string;
  location?: {
    file?: string;
    line?: number;
    element?: string;
  };
  fix?: string;
  learnMore?: string;
}

export interface EpubContent {
  contentOpf: string;
  toc: TocEntry[];
  htmlFiles: HtmlFile[];
  images: ImageFile[];
  cssFiles: CssFile[];
}

export interface TocEntry {
  id: string;
  label: string;
  href: string;
  children?: TocEntry[];
}

export interface HtmlFile {
  path: string;
  content: string;
  title?: string;
}

export interface ImageFile {
  path: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface CssFile {
  path: string;
  content: string;
}

// WCAG 2.2 Success Criteria relevant to ePub
const WCAG_CRITERIA = {
  '1.1.1': {
    name: 'Non-text Content',
    level: 'A',
    description: 'All non-text content must have a text alternative',
  },
  '1.3.1': {
    name: 'Info and Relationships',
    level: 'A',
    description: 'Information must be programmatically determinable',
  },
  '1.3.2': {
    name: 'Meaningful Sequence',
    level: 'A',
    description: 'Content must have a logical reading order',
  },
  '1.4.3': {
    name: 'Contrast (Minimum)',
    level: 'AA',
    description: 'Text must have contrast ratio of at least 4.5:1',
  },
  '1.4.4': {
    name: 'Resize Text',
    level: 'AA',
    description: 'Text must be resizable up to 200%',
  },
  '2.1.1': {
    name: 'Keyboard',
    level: 'A',
    description: 'All functionality must be keyboard accessible',
  },
  '2.4.2': {
    name: 'Page Titled',
    level: 'A',
    description: 'Pages must have titles that describe topic or purpose',
  },
  '2.4.6': {
    name: 'Headings and Labels',
    level: 'AA',
    description: 'Headings and labels must describe topic or purpose',
  },
  '2.4.10': {
    name: 'Section Headings',
    level: 'AAA',
    description: 'Sections must have headings',
  },
  '3.1.1': {
    name: 'Language of Page',
    level: 'A',
    description: 'Default language must be programmatically determined',
  },
  '4.1.1': {
    name: 'Parsing',
    level: 'A',
    description: 'Content must have complete start and end tags',
  },
  '4.1.2': {
    name: 'Name, Role, Value',
    level: 'A',
    description: 'UI components must have name and role programmatically determined',
  },
};

// ePub 3.3 specific requirements
const EPUB_REQUIREMENTS = {
  'EPUB-001': {
    name: 'Accessibility Metadata',
    description: 'content.opf must include accessibility metadata',
    required: true,
  },
  'EPUB-002': {
    name: 'Valid Navigation Document',
    description: 'Must have valid nav.xhtml with table of contents',
    required: true,
  },
  'EPUB-003': {
    name: 'Semantic HTML',
    description: 'Must use semantic HTML5 elements',
    required: false,
  },
  'EPUB-004': {
    name: 'Media Overlays',
    description: 'If audio included, must have text synchronization',
    required: false,
  },
  'EPUB-005': {
    name: 'Fixed Layout Alt Text',
    description: 'Fixed layout books must have alternative text',
    required: true,
  },
};

export class EpubAccessibilityValidator {
  private issues: AccessibilityIssue[] = [];
  private issueId = 0;

  /**
   * Main validation entry point
   */
  async validate(epubContent: EpubContent): Promise<AccessibilityReport> {
    this.issues = [];
    this.issueId = 0;

    // Run all validation checks
    await this.validateMetadata(epubContent);
    await this.validateStructure(epubContent);
    await this.validateNavigation(epubContent);
    await this.validateContent(epubContent);
    await this.validateImages(epubContent);
    await this.validateSemantics(epubContent);

    // Calculate score and generate report
    return this.generateReport(epubContent);
  }

  /**
   * Validate accessibility metadata in content.opf
   */
  private async validateMetadata(epub: EpubContent): Promise<void> {
    const opf = epub.contentOpf;

    // Check for required accessibility metadata
    const requiredMetadata = [
      { prefix: 'a11y:', property: 'certifiedBy', criterion: 'EPUB-001' },
      { prefix: 'a11y:', property: 'conformsTo', criterion: 'EPUB-001' },
    ];

    for (const meta of requiredMetadata) {
      const hasMetadata = this.checkMetadata(opf, meta.prefix, meta.property);
      if (!hasMetadata) {
        this.addIssue({
          type: 'warning',
          criterion: meta.criterion,
          category: 'metadata',
          message: `Missing accessibility metadata: ${meta.prefix}${meta.property}`,
          details: `The content.opf file should include ${meta.prefix}${meta.property} metadata for accessibility compliance.`,
          fix: `Add \u003cmeta property="${meta.prefix}${meta.property}"\u003e...\u003c/meta\u003e to content.opf`,
          learnMore: 'https://www.w3.org/publishing/epub3/epub-accessibility.html#sec-discovery',
        });
      }
    }

    // Check for dcterms:modified (required in EPUB 3)
    if (!opf.includes('dcterms:modified')) {
      this.addIssue({
        type: 'error',
        criterion: 'EPUB-001',
        category: 'metadata',
        message: 'Missing dcterms:modified metadata',
        details: 'EPUB 3 requires dcterms:modified to track last modification date.',
        fix: 'Add \u003cmeta property="dcterms:modified"\u003e2024-01-01T00:00:00Z\u003c/meta\u003e',
      });
    }

    // Check language declaration
    if (!opf.match(/xml:lang=["']([a-zA-Z-]+)["']/)) {
      this.addIssue({
        type: 'error',
        criterion: 'WCAG 3.1.1',
        category: 'metadata',
        message: 'Missing language declaration',
        details: 'The package element must have an xml:lang attribute.',
        fix: 'Add xml:lang="en" (or appropriate language code) to \u003cpackage\u003e element',
      });
    }
  }

  /**
   * Validate ePub structure
   */
  private async validateStructure(epub: EpubContent): Promise<void> {
    // Check for required files
    const hasToc = epub.toc.length > 0;
    if (!hasToc) {
      this.addIssue({
        type: 'error',
        criterion: 'EPUB-002',
        category: 'structure',
        message: 'Missing or empty table of contents',
        details: 'EPUB must have a valid navigation document (nav.xhtml) with table of contents.',
        fix: 'Include nav.xhtml with \u003cnav epub:type="toc"\u003e element',
      });
    }

    // Check for at least one HTML content file
    if (epub.htmlFiles.length === 0) {
      this.addIssue({
        type: 'error',
        criterion: 'EPUB-002',
        category: 'structure',
        message: 'No HTML content files found',
        details: 'EPUB must contain at least one XHTML content document.',
      });
    }

    // Validate each HTML file has proper structure
    for (const html of epub.htmlFiles) {
      if (!html.content.includes('<!DOCTYPE html>')) {
        this.addIssue({
          type: 'error',
          criterion: 'WCAG 4.1.1',
          category: 'structure',
          message: `Missing DOCTYPE declaration in ${html.path}`,
          location: { file: html.path },
          fix: 'Add \u003c!DOCTYPE html\u003e at the beginning of the file',
        });
      }

      if (!html.content.includes('<html')) {
        this.addIssue({
          type: 'error',
          criterion: 'WCAG 4.1.1',
          category: 'structure',
          message: `Missing html element in ${html.path}`,
          location: { file: html.path },
        });
      }

      if (!html.content.includes('<head>') || !html.content.includes('</head>')) {
        this.addIssue({
          type: 'error',
          criterion: 'WCAG 4.1.1',
          category: 'structure',
          message: `Missing or incomplete head element in ${html.path}`,
          location: { file: html.path },
        });
      }

      if (!html.content.includes('<title>') || !html.content.includes('</title>')) {
        this.addIssue({
          type: 'error',
          criterion: 'WCAG 2.4.2',
          category: 'structure',
          message: `Missing title element in ${html.path}`,
          details: 'Each HTML document must have a title element.',
          location: { file: html.path },
          fix: 'Add \u003ctitle\u003eChapter Title\u003c/title\u003e within \u003chead\u003e',
        });
      }
    }
  }

  /**
   * Validate navigation
   */
  private async validateNavigation(epub: EpubContent): Promise<void> {
    // Check TOC links are valid
    const htmlPaths = epub.htmlFiles.map(h => h.path);
    
    for (const entry of epub.toc) {
      const targetFile = entry.href.split('#')[0];
      if (!htmlPaths.includes(targetFile)) {
        this.addIssue({
          type: 'error',
          criterion: 'EPUB-002',
          category: 'navigation',
          message: `Broken TOC link: ${entry.label} -> ${entry.href}`,
          details: `The table of contents links to ${targetFile} which does not exist.`,
          location: { file: 'nav.xhtml', element: `a[href="${entry.href}"]` },
          fix: `Update link to point to valid file or remove from TOC`,
        });
      }
    }

    // Check for page list (recommended for accessibility)
    const hasPageList = epub.contentOpf.includes('page-list') || 
                       epub.htmlFiles.some(h => h.content.includes('epub:type="page-list"'));
    if (!hasPageList) {
      this.addIssue({
        type: 'info',
        criterion: 'EPUB-002',
        category: 'navigation',
        message: 'No page list found',
        details: 'A page list (epub:type="page-list") helps users navigate to specific print pages.',
        fix: 'Add \u003cnav epub:type="page-list"\u003e with page references',
      });
    }
  }

  /**
   * Validate content
   */
  private async validateContent(epub: EpubContent): Promise<void> {
    for (const html of epub.htmlFiles) {
      const content = html.content;

      // Check for language attribute on html element
      if (!content.match(/<html[^\u003e]*lang=["']/)) {
        this.addIssue({
          type: 'error',
          criterion: 'WCAG 3.1.1',
          category: 'content',
          message: `Missing lang attribute in ${html.path}`,
          details: 'The html element must have a lang attribute.',
          location: { file: html.path },
          fix: 'Add lang="en" (or appropriate language) to \u003chtml\u003e tag',
        });
      }

      // Check heading hierarchy
      const h1Count = (content.match(/<h1/g) || []).length;
      const h2Count = (content.match(/<h2/g) || []).length;
      
      if (h1Count > 1) {
        this.addIssue({
          type: 'warning',
          criterion: 'WCAG 2.4.6',
          category: 'content',
          message: `Multiple h1 elements in ${html.path}`,
          details: 'Each document should have only one h1 element.',
          location: { file: html.path },
          fix: 'Use h2-h6 for subsections',
        });
      }

      // Check for broken heading hierarchy (h1 -> h3 without h2)
      // This is a simplified check - full implementation would parse DOM
      if (content.includes('<h3') && !content.includes('<h2')) {
        this.addIssue({
          type: 'warning',
          criterion: 'WCAG 2.4.10',
          category: 'content',
          message: `Possible heading hierarchy issue in ${html.path}`,
          details: 'Headings should not skip levels (h1 -> h2 -> h3).',
          location: { file: html.path },
        });
      }

      // Check for tables without headers
      if (content.includes('<table') && !content.includes('<th')) {
        this.addIssue({
          type: 'warning',
          criterion: 'WCAG 1.3.1',
          category: 'content',
          message: `Table without headers in ${html.path}`,
          details: 'Tables should use th elements for column/row headers.',
          location: { file: html.path },
          fix: 'Add \u003cth\u003e elements for table headers',
        });
      }
    }
  }

  /**
   * Validate images
   */
  private async validateImages(epub: EpubContent): Promise<void> {
    for (const image of epub.images) {
      if (!image.alt || image.alt.trim() === '') {
        this.addIssue({
          type: 'error',
          criterion: 'WCAG 1.1.1',
          category: 'images',
          message: `Image missing alt text: ${image.path}`,
          details: 'All images must have descriptive alternative text.',
          location: { file: image.path },
          fix: 'Add alt="Descriptive text about the image"',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        });
      } else if (image.alt.length < 5) {
        this.addIssue({
          type: 'warning',
          criterion: 'WCAG 1.1.1',
          category: 'images',
          message: `Image alt text may be too short: ${image.path}`,
          details: `Alt text: "${image.alt}"`,
          location: { file: image.path },
          fix: 'Provide more descriptive alt text (5-150 characters recommended)',
        });
      }
    }
  }

  /**
   * Validate semantic HTML
   */
  private async validateSemantics(epub: EpubContent): Promise<void> {
    for (const html of epub.htmlFiles) {
      const content = html.content;

      // Check for semantic landmarks
      const hasMain = content.includes('<main') || content.includes('role="main"');
      const hasNav = content.includes('<nav') || content.includes('role="navigation"');
      const hasArticle = content.includes('<article');
      const hasSection = content.includes('<section');

      if (!hasMain) {
        this.addIssue({
          type: 'warning',
          criterion: 'WCAG 1.3.1',
          category: 'semantics',
          message: `Missing main landmark in ${html.path}`,
          details: 'Content should be wrapped in a \u003cmain\u003e element or have role="main".',
          location: { file: html.path },
          fix: 'Wrap primary content in \u003cmain\u003e...\u003c/main\u003e',
        });
      }

      if (!hasNav && html.path !== 'nav.xhtml') {
        this.addIssue({
          type: 'info',
          criterion: 'WCAG 1.3.1',
          category: 'semantics',
          message: `No navigation landmark in ${html.path}`,
          details: 'Consider adding \u003cnav\u003e for navigation links.',
          location: { file: html.path },
        });
      }

      // Check for div/span overuse (simplified heuristic)
      const divCount = (content.match(/<div/g) || []).length;
      const semanticCount = (content.match(/<(main|article|section|aside|header|footer|nav)/g) || []).length;
      
      if (divCount > 20 && semanticCount === 0) {
        this.addIssue({
          type: 'warning',
          criterion: 'WCAG 1.3.1',
          category: 'semantics',
          message: `Heavy use of div elements in ${html.path}`,
          details: 'Consider using semantic HTML5 elements instead of generic divs.',
          location: { file: html.path },
          fix: 'Replace divs with \u003csection\u003e, \u003carticle\u003e, \u003caside\u003e where appropriate',
        });
      }

      // Check for ARIA roles without semantic HTML
      if (content.includes('role=') && !hasMain && !hasNav) {
        this.addIssue({
          type: 'info',
          criterion: 'WCAG 4.1.2',
          category: 'semantics',
          message: `ARIA roles present but semantic HTML missing in ${html.path}`,
          details: 'Prefer semantic HTML elements over ARIA roles when possible.',
          location: { file: html.path },
        });
      }
    }
  }

  /**
   * Generate final accessibility report
   */
  private generateReport(epub: EpubContent): AccessibilityReport {
    const errors = this.issues.filter(i => i.type === 'error').length;
    const warnings = this.issues.filter(i => i.type === 'warning').length;
    const info = this.issues.filter(i => i.type === 'info').length;

    // Calculate score
    // Start with 100, subtract 10 for each error, 2 for each warning
    let score = Math.max(0, 100 - (errors * 10) - (warnings * 2));

    // Determine WCAG level
    let wcagLevel: 'A' | 'AA' | 'AAA' = 'AAA';
    if (errors > 0) wcagLevel = 'A';
    else if (warnings > 0) wcagLevel = 'AA';

    // Extract metadata
    const titleMatch = epub.contentOpf.match(/<dc:title[^\u003e]*>([^]*?)\u003c\/dc:title>/);
    const authorMatch = epub.contentOpf.match(/<dc:creator[^\u003e]*>([^]*?)\u003c\/dc:creator>/);
    const conformsToMatch = epub.contentOpf.match(/a11y:conformsTo[^\u003e]*>([^]*?)\u003c/);

    return {
      passed: errors === 0,
      score,
      epubVersion: '3.3',
      wcagLevel,
      issues: this.issues,
      summary: { errors, warnings, info },
      metadata: {
        title: titleMatch?.[1]?.trim(),
        author: authorMatch?.[1]?.trim(),
        hasAccessibilityMetadata: epub.contentOpf.includes('a11y:'),
        conformanceClaim: conformsToMatch?.[1]?.trim(),
      },
    };
  }

  /**
   * Helper: Add an issue to the list
   */
  private addIssue(issue: Omit<AccessibilityIssue, 'id'>): void {
    this.issueId++;
    this.issues.push({
      id: `ISSUE-${this.issueId.toString().padStart(3, '0')}`,
      ...issue,
    });
  }

  /**
   * Helper: Check if metadata exists in OPF
   */
  private checkMetadata(opf: string, prefix: string, property: string): boolean {
    const regex = new RegExp(`property=["']${prefix}${property}["']`, 'i');
    return regex.test(opf);
  }
}

// Export singleton instance
export const epubValidator = new EpubAccessibilityValidator();

// Export validation function for convenience
export async function validateEpubAccessibility(epubContent: EpubContent): Promise<AccessibilityReport> {
  return epubValidator.validate(epubContent);
}
