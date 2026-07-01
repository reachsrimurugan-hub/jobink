import { readFileSync, writeFileSync } from 'fs';

// Strip patterns inside className="..." strings only
// We replace token by token to avoid breaking JSX logic
function stripClasses(content) {
  // Remove hover: utilities (e.g. hover:bg-slate-100, hover:text-[#6D28D9])
  content = content.replace(/\bhover:[\w#/.\-\[\]()%:]+/g, '');
  // Remove transition-all / transition-colors / transition-opacity / transition-transform + optional duration-N
  content = content.replace(/\btransition-(?:all|colors|opacity|transform|none)\b/g, '');
  // Remove duration-N standalone tokens  
  content = content.replace(/\bduration-\d+\b/g, '');
  // Remove animate-in entry animations
  content = content.replace(/\banimate-in\b/g, '');
  content = content.replace(/\bfade-in\b/g, '');
  content = content.replace(/\bslide-in-from-[\w-]+\b/g, '');
  // Remove animate-ping (decorative pulsing dot)
  content = content.replace(/\banimate-ping\b/g, '');
  // Remove animate-bounce (decorative)
  content = content.replace(/\banimate-bounce\b/g, '');
  // Remove active:scale (causes compositor thrash on tap)
  content = content.replace(/\bactive:scale-\w+\b/g, '');
  // Remove active:scale-98 variant too
  content = content.replace(/\bactive:scale-\d+\b/g, '');
  // Clean up extra spaces that appear inside className strings
  content = content.replace(/[ \t]{2,}/g, ' ');
  // Clean up "className= " -> "className="" (trailing space before closing quote)
  content = content.replace(/ (["'])/g, '$1');
  return content;
}

const files = [
  // Components not yet cleaned
  'src/components/UpdatePrompt.jsx',
  'src/components/InstallBanner.jsx',
  'src/components/BottomNav.jsx',
  'src/components/Navbar.jsx',
  'src/components/ProfileViewModal.jsx',
  // Pages remaining
  'src/pages/RegisterPage.jsx',
  'src/pages/EmployerDashboard.jsx',
];

for (const f of files) {
  const original = readFileSync(f, 'utf8');
  const cleaned = stripClasses(original);
  writeFileSync(f, cleaned, 'utf8');
  console.log('Cleaned:', f);
}

console.log('Done.');
