const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      // Remove brutalist border classes (border-4 border-black, border-2 border-black, etc.)
      content = content.replace(/\bborder-4\s+border-black\b/g, '');
      content = content.replace(/\bborder-2\s+border-black\b/g, 'border border-gray-200');
      content = content.replace(/\bborder-b-4\s+border-black\b/g, 'border-b border-gray-100');
      content = content.replace(/\bborder-t-4\s+border-black\b/g, 'border-t border-gray-100');
      content = content.replace(/\bborder-l-4\s+border-black\b/g, 'border-l-4 border-blue-500');
      content = content.replace(/\bborder-r-4\s+border-black\b/g, '');
      content = content.replace(/\bborder-black\b/g, 'border-gray-200');
      
      // Additional replacements for modern look
      content = content.replace(/boxShadow:\s*["'][^"']*["']/g, ''); // remove inline box-shadows on cards
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

processDir(path.join(__dirname, 'client/src/pages'));
processDir(path.join(__dirname, 'client/src/components'));
