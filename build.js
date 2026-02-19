const fs = require('fs');
const path = require('path');

const partsDir = path.join(__dirname, 'parts');
const outFile  = path.join(__dirname, 'index.html');

const parts = ['part1.html', 'part2.html', 'part3.html'];

let html = '';
for (const part of parts) {
  const filePath = path.join(partsDir, part);
  if (!fs.existsSync(filePath)) {
    console.error('Missing part:', filePath);
    process.exit(1);
  }
  html += fs.readFileSync(filePath, 'utf8') + '\n';
}

fs.writeFileSync(outFile, html, 'utf8');
console.log('Built index.html successfully (' + html.length + ' bytes)');
