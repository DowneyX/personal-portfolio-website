const fs = require('fs');
const path = require('path');

/**
 * Converts markdown files to the project JSON content structure.
 * Markdown syntax:
 * - ## Headings (auto-detected)
 * - Regular paragraphs
 * - ```lang filename code blocks
 * - ![alt](src "caption") for images
 * - <!-- gallery -->...<!-- /gallery --> for image galleries
 * - > for blockquotes
 * - - for lists
 */

const mdDir = path.join(__dirname, '../src/content/projects');
const dataDir = path.join(__dirname, '../public/data/projects');
const indexPath = path.join(dataDir, 'index.json');
const legacyJsonPath = path.join(__dirname, '../public/data/projects.json');

function slugToTitle(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getMarkdownSlugs() {
  if (!fs.existsSync(mdDir)) {
    return [];
  }

  return fs
    .readdirSync(mdDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.basename(file, '.md'));
}

function buildProjectStub(slug) {
  return {
    slug,
    title: slugToTitle(slug),
    year: new Date().getFullYear(),
    briefDescription: '',
    tags: [],
    projectType: 'Personal project'
  };
}

function loadProjectsData() {
  const markdownSlugs = getMarkdownSlugs();
  const sourcePath = fs.existsSync(indexPath) ? indexPath : legacyJsonPath;

  if (!fs.existsSync(sourcePath)) {
    const generatedProjects = markdownSlugs.map(buildProjectStub);
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(indexPath, JSON.stringify(generatedProjects, null, 2));
    console.log(`✓ Created missing project index with ${generatedProjects.length} project(s)`);
    return generatedProjects;
  }

  let projectsData;
  try {
    projectsData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  } catch (error) {
    console.warn(`⚠ Invalid project source data. Recreating from markdown files. (${error.message})`);
    projectsData = markdownSlugs.map(buildProjectStub);
  }

  if (!Array.isArray(projectsData)) {
    console.warn('⚠ Project source data is not an array. Recreating from markdown files.');
    projectsData = markdownSlugs.map(buildProjectStub);
  }

  const knownSlugs = new Set(projectsData.map((project) => project.slug));
  markdownSlugs.forEach((slug) => {
    if (!knownSlugs.has(slug)) {
      projectsData.push(buildProjectStub(slug));
      console.log(`+ Added missing project entry: ${slug}`);
    }
  });

  return projectsData;
}

function toProjectIndexItem(project) {
  const {
    slug,
    asciiTitle,
    projectType,
    year,
    title,
    briefDescription,
    tags,
    readTime,
    role,
    stack
  } = project;

  return {
    slug,
    ...(asciiTitle !== undefined && { asciiTitle }),
    ...(projectType !== undefined && { projectType }),
    ...(year !== undefined && { year }),
    title,
    ...(briefDescription !== undefined && { briefDescription }),
    ...(tags !== undefined && { tags }),
    ...(readTime !== undefined && { readTime }),
    ...(role !== undefined && { role }),
    ...(stack !== undefined && { stack })
  };
}

// Parse markdown content into content blocks
function parseMarkdown(markdown) {
  const content = [];
  const lines = markdown.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Heading
    if (line.startsWith('##')) {
      const level = (line.match(/^#+/)[0].length);
      const text = line.replace(/^#+\s*/, '').trim();
      content.push({ type: 'heading', level, text });
      i++;
      continue;
    }

    // Gallery marker
    if (line.includes('<!-- gallery -->')) {
      const galleryLines = [];
      i++;
      while (i < lines.length && !lines[i].includes('<!-- /gallery -->')) {
        if (lines[i].trim()) {
          galleryLines.push(lines[i]);
        }
        i++;
      }
      i++; // Skip closing marker

      const images = parseGalleryImages(galleryLines);
      if (images.length > 0) {
        content.push({ type: 'gallery', images });
      }
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const matches = line.match(/```(\w+)?\s*(.*)?/);
      const language = matches?.[1] || 'typescript';
      const fileName = matches?.[2] || 'snippet.ts';

      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```

      const code = codeLines.join('\n').trim();
      content.push({ type: 'code', language, fileName, code });
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '').trim();
      content.push({ type: 'quote', text });
      i++;
      continue;
    }

    // List
    if (line.startsWith('-') && line[1] === ' ') {
      const items = [];
      let title = null;

      // Check if previous block was a heading for list title
      if (content.length > 0 && content[content.length - 1].type === 'heading') {
        const lastBlock = content.pop();
        title = lastBlock.text;
      }

      while (i < lines.length && lines[i].startsWith('-') && lines[i][1] === ' ') {
        items.push(lines[i].replace(/^-\s*/, '').trim());
        i++;
      }

      content.push({ type: 'list', items, ...(title && { title }) });
      continue;
    }

    // Image (inline)
    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\s+"([^"]+)"\)/);
    if (imageMatch) {
      const alt = imageMatch[1];
      const src = imageMatch[2];
      const caption = imageMatch[3];
      content.push({ type: 'image', src, alt, caption });
      i++;
      continue;
    }

    // YouTube embed marker: <!-- youtube ID_or_URL -->
    const youtubeMatch = line.match(/<!--\s*youtube(?:\s*[:\s])\s*(https?:\/\/[^\s]+|[A-Za-z0-9_-]{6,})\s*-->/i);
    if (youtubeMatch) {
      const value = youtubeMatch[1];
      let id = value;

      // extract id from full YouTube URLs
      try {
        if (/v=/.test(value)) {
          const params = new URLSearchParams(value.split('?')[1]);
          id = params.get('v') || value;
        } else if (/youtu\.be\//.test(value)) {
          id = value.split('youtu.be/').pop().split(/[?&]/)[0];
        } else if (/\/embed\//.test(value)) {
          id = value.split('/embed/').pop().split(/[?&]/)[0];
        }
      } catch (e) {
        // fallback to raw value
        id = value;
      }

      content.push({ type: 'video', provider: 'youtube', id });
      i++;
      continue;
    }
    // Paragraph
    if (line.trim()) {
      content.push({ type: 'paragraph', text: line.trim() });
      i++;
      continue;
    }

    i++;
  }

  return content;
}

// Parse gallery images from markdown image syntax
function parseGalleryImages(lines) {
  const images = [];
  lines.forEach(line => {
    const match = line.match(/!\[([^\]]*)\]\(([^)]+)\s+"([^"]+)"\)/);
    if (match) {
      images.push({
        src: match[2],
        alt: match[1],
        caption: match[3]
      });
    }
  });
  return images;
}

// Main conversion process
function convertMarkdownToJson() {
  const projectsData = loadProjectsData();
  fs.mkdirSync(dataDir, { recursive: true });

  const convertedSlugs = new Set();
  const projectIndex = [];

  projectsData.forEach(project => {
    const mdFile = path.join(mdDir, `${project.slug}.md`);
    const projectOutputPath = path.join(dataDir, `${project.slug}.json`);
    const projectRecord = { ...project };

    if (fs.existsSync(mdFile)) {
      const markdown = fs.readFileSync(mdFile, 'utf-8');
      projectRecord.content = parseMarkdown(markdown);
      console.log(`✓ Converted: ${project.slug}`);
    } else {
      console.log(`✗ Missing: ${mdFile}`);
    }

    fs.writeFileSync(projectOutputPath, JSON.stringify(projectRecord, null, 2));
    convertedSlugs.add(project.slug);
    projectIndex.push(toProjectIndexItem(projectRecord));
  });

  const existingOutputFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith('.json') && file !== 'index.json');

  existingOutputFiles.forEach((file) => {
    const slug = path.basename(file, '.json');
    if (!convertedSlugs.has(slug)) {
      fs.rmSync(path.join(dataDir, file));
      console.log(`- Removed stale project file: ${file}`);
    }
  });

  fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));
  console.log(`\n✓ Updated projects index`);
}

convertMarkdownToJson();
