const fs = require('fs');
let content = fs.readFileSync('app/layout.tsx', 'utf8');

const splashHTML = `
        <div id="splash-screen" suppressHydrationWarning>
          <img src="/logos/logo.png" alt="logo" />
        </div>
        <script dangerouslySetInnerHTML={{
          __html: \`
            window.addEventListener("load", () => {
              const splash = document.getElementById("splash-screen");
              if(splash) {
                splash.classList.add("fade-out");
                setTimeout(() => splash.remove(), 500);
              }
            });
          \`
        }} />
`;

content = content.replace("<ProductionGuard />", splashHTML + "\n        <ProductionGuard />");

// Add correct apple icon
content = content.replace("apple: '/logos/favicon.png',", "apple: '/apple-touch-icon.png',");

fs.writeFileSync('app/layout.tsx', content);
