import subprocess
import os
import sys
from pathlib import Path
from google import genai

# Setup environment variables
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            key, val = key.strip(), val.strip()
            if val and key not in os.environ:
                os.environ[key] = val

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("❌ ERROR: GOOGLE_API_KEY not found in .env")
    sys.exit(1)

def get_git_diff():
    # First see if there are staged changes
    staged = subprocess.run(['git', 'diff', '--cached'], capture_output=True, text=True).stdout.strip()
    if staged:
        return staged, True
    
    # If not, get unstaged changes
    unstaged = subprocess.run(['git', 'diff'], capture_output=True, text=True).stdout.strip()
    return unstaged, False

def main():
    print("🤖 SynAegis AI GitLens Killer Initialize...")
    diff, is_staged = get_git_diff()
    
    if not diff:
        print("✅ Directory clear. No changes detected.")
        sys.exit(0)

    print("🔍 Analyzing diff geometry...")
    
    client = genai.Client(api_key=API_KEY)
    prompt = f"""
You are an expert Senior DevOps Engineer & developer. Analyze the following `git diff` output and generate a perfect, purely conventional commit message.
Your output must CONTAIN ONLY the commit message itself, nothing else. No markdown blocks, no 'Here is your commit message'.

Format:
<type>(<optional scope>): <subject>

<body> (only if the diff is complex and needs explanation)
<footer> (e.g. issues fixed)

Diff to analyze:
{diff[:10000]}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        commit_message = response.text.strip().replace("```", "")
        
        print("\n📝 Generated Commit Message:")
        print("--------------------------------------------------")
        print(commit_message)
        print("--------------------------------------------------\n")
        
        if not is_staged:
            print("📦 Auto-staging all changes (git add .)")
            subprocess.run(['git', 'add', '.'])
            
        print("🚀 Applying commit...")
        subprocess.run(['git', 'commit', '-m', commit_message])
        print("✅ Commit applied successfully! Bypassed proprietary paywalls.")
        
    except Exception as e:
        print(f"❌ Error communicating with SynAegis core: {e}")

if __name__ == "__main__":
    main()
