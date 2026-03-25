import re
import os

components = [
    "frontend/components/CICDDashboard.tsx",
    "frontend/components/CloudDashboard.tsx",
    "frontend/components/SecurityDashboard.tsx",
    "frontend/components/NotificationBell.tsx"
]

for fp in components:
    if os.path.exists(fp):
        with open(fp, "r") as f:
            content = f.read()
        
        content = content.replace("setDarkMode(!darkMode)", "setDarkMode()")

        with open(fp, "w") as f:
            f.write(content)

