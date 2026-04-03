export interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface ProjectContentBlock {
  type: 'heading' | 'paragraph' | 'image' | 'gallery' | 'code' | 'quote' | 'list';
  title?: string;
  level?: 2 | 3 | 4;
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
  images?: ProjectImage[];
  language?: string;
  fileName?: string;
  code?: string;
  items?: string[];
}

export interface Project {
  slug: string;
  asciiTitle?: string;
  projectType?: string;
  year?: number;
  title: string;
  briefDescription?: string;
  tags?: string[];
  readTime?: string;
  role?: string;
  stack?: string[];
  content?: ProjectContentBlock[];
}
