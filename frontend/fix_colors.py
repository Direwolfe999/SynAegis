import re
import os

components = [
    "/home/direwolfe-x/SynAegis/frontend/components/CICDDashboard.tsx",
    "/home/direwolfe-x/SynAegis/frontend/components/CloudDashboard.tsx",
    "/home/direwolfe-x/SynAegis/frontend/components/SecurityDashboard.tsx",
    "/home/direwolfe-x/SynAegis/frontend/components/Sidebar.tsx",
    "/home/direwolfe-x/SynAegis/frontend/components/SettingsDashboard.tsx"
]

for fp in components:
    if os.path.exists(fp):
        with open(fp, "r") as f:
            content = f.read()
            
        # Address contrast requirements: "all the grey text should turn pure black... dim should be brightly lit"
        # Since we use tailwind, we can adjust dark: classes to keep the high-end look while making the default (light) modes high contrast.
        # Replacing light theme grey text with darker grey or black, whilst retaining dark:text-gray-400
        content = content.replace("text-gray-400 dark:text-gray-400", "text-black dark:text-gray-400")
        content = content.replace("text-gray-500", "text-gray-800 dark:text-gray-500")
        content = content.replace("text-gray-400", "text-black dark:text-gray-400")
        content = content.replace("text-gray-300", "text-gray-900 dark:text-gray-300")
        content = content.replace("text-gray-600", "text-black dark:text-gray-400")

        with open(fp, "w") as f:
            f.write(content)

