import os
try:
    from anthropic import Anthropic
except ImportError:
    pass

def summarize_mr_with_anthropic(mr_diff_text: str) -> str:
    """Uses Anthropic Claude to summarize a merge request risk and details."""
    api_key = os.getenv("ANTHROPIC_API_KEY", "mock_key")
    if api_key == "mock_key":
        return "MOCK SUMMARY: This MR updates UI components and fixes a pipeline race condition. Risk is LOW. No vulnerabilities detected."

    try:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": f"Summarize this GitLab merge request diff and assess its risk level:\n\n{mr_diff_text[:4000]}"}
            ]
        )
        return response.content[0].text
    except Exception as e:
        return f"Error using Anthropic: {str(e)}"
