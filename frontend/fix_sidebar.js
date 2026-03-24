const fs = require('fs');
let content = fs.readFileSync('components/Sidebar.tsx', 'utf8');

if (!content.includes('import PWAInstallButton')) {
    content = content.replace(
        /import \{ motion, AnimatePresence \} from 'framer-motion';/,
        "import { motion, AnimatePresence } from 'framer-motion';\nimport PWAInstallButton from './PWAInstallButton';"
    );
}

const targetDiv = `<div className="mt-8 px-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm">`;

const installHtml = `
        <div className="mt-8 px-6 flex justify-center">
            <PWAInstallButton />
        </div>
        <div className="mt-8 px-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm">`;

if (!content.includes('<PWAInstallButton />')) {
  // It might not have the target div, let's just insert it above the orb status config
  content = content.replace(targetDiv, installHtml);
}

fs.writeFileSync('components/Sidebar.tsx', content);
console.log("Sidebar modified");
