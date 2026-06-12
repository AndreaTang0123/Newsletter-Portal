import os
import html
import httpx
from typing import Tuple

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


async def generate_newsletter_draft(prompt: str, tone: str) -> Tuple[str, str]:
    """
    Generate only a short overview/summary section for an imported HTML newsletter.

    """
    title = "Imported HTML Newsletter"

    fallback_overview = f"""
    <section style="font-family: Arial, sans-serif; padding: 16px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
        <h2 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 20px;">Newsletter Overview</h2>
        <p style="margin: 0; line-height: 1.6;">Here is a brief overview of the newsletter content below. Please review the imported email before sending.</p>
    </section>
    """

    if not GEMINI_API_KEY:
        return title, fallback_overview

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "You are helping a newsletter curator prepare an imported HTML email for sending. "
                            "Generate ONLY a short overview/summary section that will appear before the original email. "
                            "Do not rewrite, summarize into a full newsletter, or modify the original HTML. "
                            "Return only clean HTML for the overview section. "
                            "Use one heading and one concise paragraph. "
                            f"Tone: {tone}.\n\n"
                            f"Imported email content/context:\n{prompt}"
                        )
                    }
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                ai_html = data["candidates"][0]["content"]["parts"][0]["text"].strip()

                # Remove common markdown fences if the model returns them.
                ai_html = ai_html.replace("```html", "").replace("```", "").strip()

                if ai_html:
                    return title, ai_html
    except Exception as e:
        print(f"Failed to query Gemini API: {str(e)}")

    return title, fallback_overview
