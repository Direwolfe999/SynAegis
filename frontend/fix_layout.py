import re

with open('app/layout.tsx', 'r') as f:
    content = f.read()

# Remove EVERYTHING between the service worker div and ProductionGuard
start_marker = "</div>\n        "
end_marker = "<ProductionGuard />"

start_idx = content.find("          }} />\n        </div>") + len("          }} />\n        </div>")
end_idx = content.find("<ProductionGuard />")

clean_content = content[:start_idx] + "\n\n" + """        <div id="splash-screen" suppressHydrationWarning>
          <img src="/logos/logo.png" alt="logo" />
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            function removeSplash() {
              const splash = document.getElementById("splash-screen");
              if (splash) {
                splash.classList.add("fade-out");
                setTimeout(() => {
                  try { splash.remove(); } catch(e) {}
                }, 500);
              }
            }
            if (document.readyState === 'complete') {
              removeSplash();
            } else {
              window.addEventListener('load', removeSplash);
              // Fallback just in case load is blocked
              setTimeout(removeSplash, 2000); 
            }
          `
        }} />

        """ + content[end_idx:]

with open('app/layout.tsx', 'w') as f:
    f.write(clean_content)
