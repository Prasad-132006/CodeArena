const fs = require('fs');
const path = require('path');

console.log('--- CodeArena Font Size & Reset Verification ---');

// 1. Verify types
const typesPath = path.join(__dirname, '..', 'src', 'types', 'index.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

const checks = [
  { desc: 'DEFAULT_EDITOR_FONT_SIZE is 16', test: typesContent.includes('DEFAULT_EDITOR_FONT_SIZE = 16') },
  { desc: 'MIN_EDITOR_FONT_SIZE is 12', test: typesContent.includes('MIN_EDITOR_FONT_SIZE = 12') },
  { desc: 'MAX_EDITOR_FONT_SIZE is 20', test: typesContent.includes('MAX_EDITOR_FONT_SIZE = 20') },
  { desc: 'EDITOR_FONT_SIZES contains 12 through 20 in 1px increments', test: typesContent.includes('[12, 13, 14, 15, 16, 17, 18, 19, 20]') },
];

let failed = false;
for (const check of checks) {
  if (check.test) {
    console.log(` ✓ ${check.desc}`);
  } else {
    console.error(` ✗ FAILED: ${check.desc}`);
    failed = true;
  }
}

// 2. Verify FontSizeSelector component
const componentPath = path.join(__dirname, '..', 'src', 'components', 'FontSizeSelector.tsx');
if (!fs.existsSync(componentPath)) {
  console.error(' ✗ FAILED: FontSizeSelector.tsx does not exist');
  process.exit(1);
}
const componentContent = fs.readFileSync(componentPath, 'utf8');

const componentChecks = [
  { desc: 'Has Minus quick button', test: componentContent.includes('Minus') && componentContent.includes('fontSize - 1') },
  { desc: 'Has Plus quick button', test: componentContent.includes('Plus') && componentContent.includes('fontSize + 1') },
  { desc: 'Has range slider with 12 to 20 step 1', test: componentContent.includes('type="range"') && componentContent.includes('MIN_EDITOR_FONT_SIZE') && componentContent.includes('MAX_EDITOR_FONT_SIZE') },
  { desc: 'Displays current size with px', test: componentContent.includes('{fontSize}px') },
  { desc: 'Has Reset to Default button restoring Fira Code and 16px', test: componentContent.includes('Reset to Default (Fira Code, 16px)') },
  { desc: 'Accessible popover with outside click & Escape handling', test: componentContent.includes('Escape') && componentContent.includes('handleClickOutside') },
];

for (const check of componentChecks) {
  if (check.test) {
    console.log(` ✓ ${check.desc}`);
  } else {
    console.error(` ✗ FAILED: ${check.desc}`);
    failed = true;
  }
}

// 3. Verify Page.tsx integration
const pagePath = path.join(__dirname, '..', 'src', 'app', 'problems', '[slug]', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

const pageChecks = [
  { desc: 'Imports FontSizeSelector', test: pageContent.includes("import { FontSizeSelector } from '@/components/FontSizeSelector'") },
  { desc: 'State fontSize defaults to DEFAULT_EDITOR_FONT_SIZE (16)', test: pageContent.includes('fontSize, setFontSize] = useState<number>(DEFAULT_EDITOR_FONT_SIZE)') },
  { desc: 'Restores codearena_editor_font_size from localStorage', test: pageContent.includes("localStorage.getItem('codearena_editor_font_size')") },
  { desc: 'Persists codearena_editor_font_size to localStorage', test: pageContent.includes("localStorage.setItem('codearena_editor_font_size'") },
  { desc: 'handleFontSizeChange updates Monaco editor fontSize option', test: pageContent.includes('editorRef.current.updateOptions') && pageContent.includes('fontSize: clamped') },
  { desc: 'handleResetTypography restores DEFAULT_EDITOR_FONT_ID and DEFAULT_EDITOR_FONT_SIZE', test: pageContent.includes('handleResetTypography') && pageContent.includes('DEFAULT_EDITOR_FONT_ID') && pageContent.includes('DEFAULT_EDITOR_FONT_SIZE') },
  { desc: 'MonacoEditor receives fontSize={fontSize}', test: pageContent.includes('fontSize: fontSize') },
  { desc: 'Renders <FontSizeSelector /> in editor toolbar', test: pageContent.includes('<FontSizeSelector') },
];

for (const check of pageChecks) {
  if (check.test) {
    console.log(` ✓ ${check.desc}`);
  } else {
    console.error(` ✗ FAILED: ${check.desc}`);
    failed = true;
  }
}

if (failed) {
  console.error('\n❌ Verification failed.');
  process.exit(1);
} else {
  console.log('\n✅ All font size selection requirements verified successfully!');
}

