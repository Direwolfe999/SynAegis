const fs = require('fs');
let content = fs.readFileSync('app/layout.tsx', 'utf8');

// remove all instances of splash screen
content = content.replace(/<div id="splash-screen"[\s\S]*?<\/script>/g, "");
content = content.replace(/\n\s*\n\s*<ProductionGuard \/>/, "\n        <ProductionGuard />");


const correctSplash = `
        <div id="splash-screen" suppressHydrationWarning>
          <img src="/logos/logo.png" alt="logo" />
        </div>
        <script dangerouslySetInnerHTML={{
          __html: \`
            function removeSplash() {
              const splash = document.getElementById("splash-screen");
              if (splash) {
                splash.classList.add("fade-out");
                setTimeout(() => {
                  try { splash.remove(); } catch(e) {}
                  document.body.style.overflow = 'auto';
                }, 500);
              }
            }
            if (document.readyState === 'complete') {
              removeSplash();
            } else {
              window.addEventListener('load', removeSplash);
              // Fallback just in case load is blocked
              setTimeout(removeSplash, 2500); 
            }
          \`
        }} />
`;

content = content.replace("<ProductionGuard />", correctSplash + "\n        <ProductionGuard />");
fs.writeFileSync('app/layout.tsx', content);
