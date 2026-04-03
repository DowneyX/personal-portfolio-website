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
const jsonPath = path.join(__dirname, '../public/data/projects.json');

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
  const projectsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  projectsData.forEach(project => {
    const mdFile = path.join(mdDir, `${project.slug}.md`);

    if (fs.existsSync(mdFile)) {
      const markdown = fs.readFileSync(mdFile, 'utf-8');
      project.content = parseMarkdown(markdown);
      console.log(`✓ Converted: ${project.slug}`);
    } else {
      console.log(`✗ Missing: ${mdFile}`);
    }
  });

  // Write updated projects.json
  fs.writeFileSync(jsonPath, JSON.stringify(projectsData, null, 2));
  console.log(`\n✓ Updated projects.json`);
}

convertMarkdownToJson();
