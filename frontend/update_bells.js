const fs = require('fs');

function replaceBell(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add import if missing and if we are replacing Bell
    if (content.includes('<Bell ') && !content.includes('NotificationBell')) {
        content = content.replace(/import \{[^}]*\} from "lucide-react";/g, match => {
            if (!match.includes('Bell')) return match; 
            return match; // Bell is already in lucide-react group
        });
        
        // Find imports block end to add NotificationBell import
        const importsEnd = content.lastIndexOf('import ');
        const nextLineBreak = content.indexOf('\\n', importsEnd);
        
        let newImport = `\\nimport { NotificationBell } from "./NotificationBell";`;
        if(file.includes('SettingsDashboard')) {
           // Settings Dashboard might have slightly different import location but they are all in components/
           newImport = `\\nimport { NotificationBell } from "./NotificationBell";`;
        }
        
        content = content.replace(/(import [^;]+;[\\s]*)+(?=function|const|export)/g, match => {
            return match + 'import { NotificationBell } from "./NotificationBell";\\n';
        });
    }

    // Replace <Bell className="..." /> inside a button/div but only when it's part of the top right nav (usually size 5 or 6)
    // Actually we can just replace the whole wrapping div for the icon to not mess up the structure
    content = content.replace(/<div className="[^"]*?(w-10 h-10|w-8 h-8)[^"]*?">\\s*<Bell className="[^"]*?" \/>\\s*<\/div>/g, '<NotificationBell darkMode={darkMode} />');
    
    // Sometimes it's a button
    content = content.replace(/<button className="[^"]*?(w-10 h-10|w-8 h-8)[^"]*?">\\s*<Bell className="[^"]*?" \/>\\s*<\/button>/g, '<NotificationBell darkMode={darkMode} />');
    
    // Sometimes it's just raw Bell 
    content = content.replace(/<Bell className="w-5 h-5[^"]" \/>/g, '<NotificationBell darkMode={darkMode} />');

    fs.writeFileSync(file, content);
}

// SecurityDashboard
let sec = fs.readFileSync('components/SecurityDashboard.tsx', 'utf8');
if (!sec.includes('NotificationBell')) {
    sec = sec.replace('import { useToast } from "./ToastProvider";', 'import { useToast } from "./ToastProvider";\\nimport { NotificationBell } from "./NotificationBell";');
    // Security Dashboard has <Bell className="w-5 h-5" /> inside a <button className={`p-2 rounded-xl transition-colors...`>
    sec = sec.replace(/<button className=\{`p-2 rounded-xl transition-colors \$\{darkMode \? "hover:bg-white\/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"\}\`\}>\s*<Bell className="w-5 h-5" \/>\s*<\/button>/g, '<NotificationBell darkMode={darkMode} />');
    fs.writeFileSync('components/SecurityDashboard.tsx', sec);
}

// CICDDashboard
let cicd = fs.readFileSync('components/CICDDashboard.tsx', 'utf8');
if (!cicd.includes('NotificationBell')) {
    cicd = cicd.replace('import { useToast } from "./ToastProvider";', 'import { useToast } from "./ToastProvider";\\nimport { NotificationBell } from "./NotificationBell";');
    cicd = cicd.replace(/<button className=\{`p-2.5 rounded-xl transition-colors \$\{darkMode \? "hover:bg-white\/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"\}\`\}>\s*<Bell className="w-5 h-5" \/>\s*<\/button>/g, '<NotificationBell darkMode={darkMode} />');
    fs.writeFileSync('components/CICDDashboard.tsx', cicd);
}

// CloudDashboard
let cl = fs.readFileSync('components/CloudDashboard.tsx', 'utf8');
if (!cl.includes('NotificationBell')) {
    cl = cl.replace('import { useToast } from "./ToastProvider";', 'import { useToast } from "./ToastProvider";\\nimport { NotificationBell } from "./NotificationBell";');
    cl = cl.replace(/<button className=\{`p-2 rounded-xl transition-colors \$\{darkMode \? "hover:bg-white\/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"\}\`\}>\s*<Bell className="w-5 h-5" \/>\s*<\/button>/g, '<NotificationBell darkMode={darkMode} />');
    fs.writeFileSync('components/CloudDashboard.tsx', cl);
}

