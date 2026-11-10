const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
const files = fs.readdirSync(fontsDir);
console.log('Found fonts in public/fonts:');
files.forEach((f) => {
  const stat = fs.statSync(path.join(fontsDir, f));
  console.log(` - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
});

const required = [
  'AnonymousPro-Regular.ttf',
  'CaskaydiaCoveNerdFont-Regular.ttf',
  'FiraCode-Regular.ttf',
  'JetBrainsMono-Regular.ttf',
  'SourceCodePro-Regular.ttf',
];

const missing = required.filter((f) => !files.includes(f));
if (missing.length !== 0) {
  console.error('ERROR: Missing font files:', missing);
  process.exit(1);
}

// Verify types definition
const typesFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'types', 'index.ts'), 'utf8');

const requiredFonts = [
  'Anonymous Pro',
  'Fira Code',
  'JetBrains Mono',
  'Source Code Pro',
  'Cascadia Code Nerd Font',
  'Monospace (system default)',
];

console.log('\nChecking font definitions in types/index.ts:');
for (const font of requiredFonts) {
  if (typesFile.includes(font)) {
    console.log(` ✓ ${font} present in types`);
  } else {
    console.error(` ✗ ${font} missing in types!`);
    process.exit(1);
  }
}

// Verify Fira Code is default
if (typesFile.includes("DEFAULT_EDITOR_FONT_ID: EditorFontId = 'fira-code'")) {
  console.log(' ✓ Fira Code is configured as DEFAULT_EDITOR_FONT_ID');
} else {
  console.error(' ✗ Fira Code is not DEFAULT_EDITOR_FONT_ID');
  process.exit(1);
}

// Verify globals.css @font-face declarations
const globalsCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'globals.css'), 'utf8');
console.log('\nChecking globals.css font declarations:');
const cssFonts = [
  'Anonymous Pro',
  'Fira Code',
  'JetBrains Mono',
  'Source Code Pro',
  'Cascadia Code Nerd Font',
  'CaskaydiaCove Nerd Font',
];

for (const font of cssFonts) {
  if (globalsCss.includes(`font-family: '${font}'`)) {
    console.log(` ✓ @font-face for '${font}' is declared`);
  } else {
    console.error(` ✗ @font-face for '${font}' is missing in globals.css!`);
    process.exit(1);
  }
}

// Verify layout.tsx preconnect and stylesheet
const layoutTsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'layout.tsx'), 'utf8');
if (layoutTsx.includes('fonts.googleapis.com') && layoutTsx.includes('Fira+Code')) {
  console.log(' ✓ Google Fonts preconnect & stylesheet present in layout.tsx');
} else {
  console.error(' ✗ Google Fonts links missing in layout.tsx!');
  process.exit(1);
}

console.log('\n✅ All font files, definitions, styles, and configurations verified successfully!');

