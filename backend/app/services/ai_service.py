import os
import httpx
from typing import Tuple

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

async def generate_newsletter_draft(prompt: str, tone: str) -> Tuple[str, str]:
    title = f"AI Update: {prompt[:30]}"
    
    # Standard HTML layout template for the newsletter
    html_template = f"""
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <header style="background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 20px; border-top-left-radius: 6px; border-top-right-radius: 6px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Weekly Briefing</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Curated AI-Powered Intelligence</p>
        </header>
        
        <main style="padding: 24px 20px; color: #1a202c; line-height: 1.6;">
            <h2 style="color: #4f46e5; margin-top: 0;">Featured Update: {prompt}</h2>
            <p>We are excited to share our latest insights prepared in a <strong>{tone}</strong> tone of voice:</p>
            <p>Based on your input, we have compiled several key metrics indicating continuous progress across core targets. Our teams remain committed to delivering optimal solutions while scaling security and performance standards.</p>
            
            <div style="background-color: #f7fafc; border-left: 4px solid #06b6d4; padding: 12px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic; color: #4a5568;">"Empowering teams with actionable data ensures long-term development milestones are achieved cleanly."</p>
            </div>
            
            <p>Please feel free to reach out to our curator team with comments, suggestions, or topics for future newsletters.</p>
        </main>
        
        <footer style="background-color: #f7fafc; padding: 16px; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7;">
            <p style="margin: 0 0 8px 0;">Company Inc, 123 Science Park Drive, Tech City</p>
            <p style="margin: 0;">
                You are receiving this update based on your subscribed preferences. 
                <br/>
                <a href="http://localhost:3000/unsubscribe" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Manage Preferences or Unsubscribe</a>.
            </p>
        </footer>
    </div>
    """

    if not GEMINI_API_KEY:
        # Fallback to template if no API key is specified
        return title, html_template

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{
                "text": f"Write a newsletter section based on the prompt: '{prompt}'. Tone: {tone}. Write only the content paragraphs, no greeting and no HTML wrapper."
            }]
        }]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
                # Substitute AI text into content segment of the template
                html_filled = html_template.replace(
                    "<p>Based on your input, we have compiled several key metrics indicating continuous progress across core targets. Our teams remain committed to delivering optimal solutions while scaling security and performance standards.</p>",
                    f"<p>{ai_text}</p>"
                )
                return title, html_filled
    except Exception as e:
        print(f"Failed to query Gemini API: {str(e)}")
        
    return title, html_template
