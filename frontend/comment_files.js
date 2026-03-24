const fs = require('fs');

const comments = {
    'components/WarRoom.tsx': `/**
 * WAR ROOM COMPONENT
 * -------------------
 * Think of this as the brain and central command of the platform. 
 * It handles the live WebSocket connection to the AI, processes your microphone audio, 
 * capturing video frames for the vision feed, and orchestrates the glowing "Orb" UI.
 * It's built to smoothly degrade if the network drops, dropping back to offline modes when necessary.
 */\n`,
    'components/SettingsDashboard.tsx': `/**
 * SETTINGS DASHBOARD
 * -------------------
 * The control center for user customization. This component groups everything 
 * from UI theme preferences and API keys, to integrating third-party services (like GitHub or AWS).
 * It uses a tabbed interface to keep the heavy amount of configuration organized and approachable.
 */\n`,
    'components/SecurityDashboard.tsx': `/**
 * SECURITY DASHBOARD
 * -------------------
 * The protective shield of the app. This checks for active threats, monitors the firewall, 
 * and maps out IP attacks worldwide. It's essentially the dashboard you'd look at 
 * when you want to know "Are we under attack right now?"
 */\n`,
    'components/CloudDashboard.tsx': `/**
 * CLOUD DASHBOARD
 * -------------------
 * Your infrastructure's heartbeat. This file monitors the health of your servers, 
 * tracks cloud costs, and actively searches for "zombie" servers (resources running but unused).
 * It helps keep deployments efficient and eco-friendly.
 */\n`,
    'components/CICDDashboard.tsx': `/**
 * CI/CD DASHBOARD
 * -------------------
 * The assembly line monitor. This tracks all the code being built, tested, and shipped.
 * If a pipeline breaks, this component highlights the failure and allows you to ask the AI 
 * for an emergency patch or automatic rollback.
 */\n`,
    'lib/api.ts': `/**
 * API NETWORKING LAYER
 * -------------------
 * The primary communication bridge. Every time the frontend needs to talk to the backend, 
 * it goes through here. By keeping all fetch() calls in this one file, we ensure that if 
 * the base URL or authentication method ever changes, we only have to update it in one place.
 */\n`,
    'app/page.tsx': `/**
 * MAIN DASHBOARD ROUTER (page.tsx)
 * -------------------
 * The traffic cop for the screen. Rather than using multiple separate URLs, 
 * our app mostly operates as a Single Page Application (SPA). This file swaps out 
 * the major components (like switching from War Room to Settings) seamlessly without reloading.
 */\n`,
    'app/layout.tsx': `/**
 * ROOT LAYOUT
 * -------------------
 * The foundational wrapper for the entire application. It sets up the HTML document structure, 
 * injects the dark mode colors, initializes the splash screen, and securely registers the 
 * Service Worker so the app can install and behave like a native Desktop/Mobile app (PWA).
 */\n`,
    'components/NotificationBell.tsx': `/**
 * NOTIFICATION BELL
 * -------------------
 * The platform's tap-on-the-shoulder. It quietly polls the backend in the background 
 * and alerts the user when something important happens (like a pipeline succeeding, or a threat detected).
 * It dynamically color-codes its icon based on how severe the latest alert is.
 */\n`,
    'components/Sidebar.tsx': `/**
 * MAIN SIDEBAR NAVIGATION
 * -------------------
 * The primary steering wheel for the app. It collapses smoothly on smaller screens 
 * and expands on desktops. It tracks the active view and ensures the user always knows 
 * where they are inside the platform.
 */\n`
};

for (const [file, comment] of Object.entries(comments)) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes('/**\\n *')) {
            // Prepend comment
            let finalContent = content;
            if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
                const parts = content.split('\\n');
                const firstLine = parts.shift();
                finalContent = firstLine + '\\n\\n' + comment + parts.join('\\n');
            } else {
                finalContent = comment + content;
            }
            fs.writeFileSync(file, finalContent);
            console.log(\`Commented \${file}\`);
        } else {
            console.log(\`\${file} might already have a header comment.\`);
        }
    }
}
