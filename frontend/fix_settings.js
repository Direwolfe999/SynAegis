const fs = require('fs');
let content = fs.readFileSync('components/SettingsDashboard.tsx', 'utf8');

if (!content.includes('import PWAInstallButton')) {
    content = content.replace(
        /import \{ useToast \} from "\.\/ToastProvider";/,
        'import { useToast } from "./ToastProvider";\nimport PWAInstallButton from "./PWAInstallButton";'
    );
}

const targetDiv = '<div className="space-y-6 md:space-y-8">';
const installPromptHtml = `
  <div className="space-y-6 md:space-y-8">
    <div className={\`p-4 rounded-xl border flex items-center justify-between \${darkMode ? "bg-cyan-950/20 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"}\`}>
      <div>
        <h3 className={\`text-sm font-semibold mb-1 \${darkMode ? "text-cyan-400" : "text-cyan-700"}\`}>Install Desktop App</h3>
        <p className={\`text-xs \${darkMode ? "text-cyan-200/60" : "text-cyan-600/80"}\`}>Get the native offline experience with push notifications.</p>
      </div>
      <PWAInstallButton />
    </div>
`;
content = content.replace(targetDiv, installPromptHtml);

fs.writeFileSync('components/SettingsDashboard.tsx', content);
