const fs = require('fs');
let content = fs.readFileSync('components/Sidebar.tsx', 'utf8');
content = content.replace("import PWAInstallButton from './PWAInstallButton';", "");
fs.writeFileSync('components/Sidebar.tsx', content);
