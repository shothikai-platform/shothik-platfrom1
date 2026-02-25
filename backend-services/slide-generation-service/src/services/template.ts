/**
 * Template Service
 * Manages slide templates and design systems
 */

import { SlideTemplate, SlideDeck, SlideContent, SlideType } from '../types/index.js';

export const defaultTemplates: SlideTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, corporate style for business presentations',
    category: 'business',
    thumbnail: '/templates/professional.png',
    colorScheme: {
      primary: '#0066CC',
      secondary: '#4A90E2',
      background: '#FFFFFF',
      text: '#333333',
      accent: '#F5F5F5'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    layouts: ['title', 'content', 'two_column', 'bullets']
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold, vibrant design for creative presentations',
    category: 'creative',
    thumbnail: '/templates/creative.png',
    colorScheme: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      background: '#FFF5F0',
      text: '#2D2D2D',
      accent: '#FFE4D6'
    },
    fontFamily: 'Poppins, system-ui, sans-serif',
    layouts: ['title', 'content', 'image', 'quote']
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, elegant design with focus on content',
    category: 'minimal',
    thumbnail: '/templates/minimal.png',
    colorScheme: {
      primary: '#333333',
      secondary: '#666666',
      background: '#FFFFFF',
      text: '#000000',
      accent: '#F0F0F0'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    layouts: ['title', 'content', 'bullets']
  },
  {
    id: 'educational',
    name: 'Educational',
    description: 'Clear, structured design for learning materials',
    category: 'education',
    thumbnail: '/templates/educational.png',
    colorScheme: {
      primary: '#10B981',
      secondary: '#34D399',
      background: '#F0FDF4',
      text: '#1F2937',
      accent: '#D1FAE5'
    },
    fontFamily: 'Roboto, system-ui, sans-serif',
    layouts: ['title', 'content', 'bullets', 'numbered']
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Traditional corporate presentation style',
    category: 'business',
    thumbnail: '/templates/business.png',
    colorScheme: {
      primary: '#1E3A5F',
      secondary: '#2E5A8F',
      background: '#FFFFFF',
      text: '#1A1A1A',
      accent: '#E8EEF4'
    },
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    layouts: ['title', 'content', 'two_column', 'chart']
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold colors',
    category: 'creative',
    thumbnail: '/templates/modern.png',
    colorScheme: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      background: '#FAF5FF',
      text: '#1F2937',
      accent: '#E9D5FF'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    layouts: ['title', 'content', 'image', 'bullets']
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Sleek dark theme for dramatic presentations',
    category: 'minimal',
    thumbnail: '/templates/dark.png',
    colorScheme: {
      primary: '#60A5FA',
      secondary: '#93C5FD',
      background: '#111827',
      text: '#F9FAFB',
      accent: '#1F2937'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    layouts: ['title', 'content', 'bullets', 'quote']
  }
];

export class TemplateService {
  private templates: Map<string, SlideTemplate>;

  constructor() {
    this.templates = new Map();
    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): SlideTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): SlideTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): SlideTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  applyTemplate(deck: SlideDeck, templateId: string): SlideDeck {
    const template = this.getTemplate(templateId);
    if (!template) return deck;

    return {
      ...deck,
      theme: templateId,
      colorScheme: template.colorScheme,
      fontFamily: template.fontFamily
    };
  }

  // Get layout for a slide type
  getLayout(slideType: SlideType, templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) return 'default';

    // Map slide types to layouts
    const layoutMap: Record<SlideType, string> = {
      title: 'centered',
      content: 'default',
      two_column: 'split',
      image: 'full-image',
      chart: 'default',
      quote: 'centered',
      divider: 'centered',
      bullets: 'left-aligned',
      numbered: 'left-aligned'
    };

    return layoutMap[slideType] || 'default';
  }

  // Generate CSS for a template
  generateStyles(templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) return '';

    return `
      :root {
        --slide-primary: ${template.colorScheme.primary};
        --slide-secondary: ${template.colorScheme.secondary};
        --slide-background: ${template.colorScheme.background};
        --slide-text: ${template.colorScheme.text};
        --slide-accent: ${template.colorScheme.accent};
        --slide-font: ${template.fontFamily};
      }
    `;
  }
}

export default TemplateService;
