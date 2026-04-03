const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const contentDir = path.join(__dirname, '../src/content/projects');

console.log(`⏳ Watching for markdown changes in: ${contentDir}`);
console.log('Press Ctrl+C to stop.\n');

// Debounce function to prevent multiple rapid conversions
let timeout;
function debounceConvert() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.log(`\n🔄 Converting markdown...`);
    const convert = spawn('node', [path.join(__dirname, 'convert-markdown.js')]);

    convert.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    convert.stderr.on('data', (data) => {
      console.error(`❌ ${data}`);
    });

    convert.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Conversion complete\n');
      }
    });
  }, 500); // Wait 500ms after file changes stop
}

// Watch for changes in markdown files
fs.watch(contentDir, (eventType, filename) => {
  if (filename && filename.endsWith('.md')) {
    console.log(`📝 Detected change: ${filename}`);
    debounceConvert();
  }
});
