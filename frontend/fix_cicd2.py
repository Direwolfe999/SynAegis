import re
import os

components = [
    "components/CICDDashboard.tsx",
    "components/CloudDashboard.tsx",
    "components/SecurityDashboard.tsx",
    "components/NotificationBell.tsx",
    "components/SettingsDashboard.tsx"
]

for fp in components:
    if os.path.exists(fp):
        with open(fp, "r") as f:
            content = f.read()
            
        content = content.replace("setDarkMode(!darkMode)", "setDarkMode()")
        # Some components might use the toggleTheme name directly
        content = content.replace("toggleTheme(!isDarkMode)", "toggleTheme()")

        with open(fp, "w") as f:
            f.write(content)

