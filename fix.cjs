const fs = require('fs');
//
let content = fs.readFileSync('src/App.css', 'utf8');

const rootBlock = `:root {
  --primary-color: #64b4ff;
}

`;

if (!content.includes('--primary-color')) {
  content = rootBlock + content;
}

content = content.replace(/#64b4ff/g, 'var(--primary-color)');

content = content.replace(/rgba\(100, 180, 255, ([\d.]+)\)/g, (match, p1) => {
  const percent = Math.round(parseFloat(p1) * 100);
  return `color-mix(in srgb, var(--primary-color) ${percent}%, transparent)`;
});

content = content.replace(/rgba\(180, 210, 255, ([\d.]+)\)/g, (match, p1) => {
  const percent = Math.round(parseFloat(p1) * 100);
  return `color-mix(in srgb, var(--primary-color) ${percent}%, transparent)`;
});

fs.writeFileSync('src/App.css', content);
