import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
API_URL = os.getenv("API_URL", "http://localhost:8000")

def inject_tracking_pixel(html_content: str, send_history_id: int) -> str:
    """Inject a tracking pixel into HTML content for open tracking."""
    tracking_url = f"{API_URL}/api/v1/track/open/{send_history_id}"
    tracking_pixel = f'<img src="{tracking_url}" width="1" height="1" alt="" style="display:none;" />'
    
    # Insert before closing body tag if it exists, otherwise append
    if '</body>' in html_content.lower():
        html_content = html_content.replace('</body>', f'{tracking_pixel}</body>')
    else:
        html_content = html_content + tracking_pixel
    
    return html_content

def send_email(to_email: str, subject: str, html_content: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[SMTP mock] Sending email to {to_email} | Subject: {subject}")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP error: {str(e)}")
        return False

def send_subscription_change_confirmation(to_email: str, categories: List[str], subscribed: bool):
    action = "subscribed to" if subscribed else "unsubscribed from"
    category_list = ", ".join(categories) if categories else "all notifications"
    
    subject = f"Subscription Confirmation: PortalAI Updates"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366f1;">Subscription Status Change</h2>
        <p>This email confirms that you have successfully <strong>{action}</strong> the following updates:</p>
        <blockquote style="background: #f7fafc; padding: 12px; border-left: 4px solid #6366f1; margin: 16px 0;">
            {category_list}
        </blockquote>
        <p>If you did not request this update, please manage your preferences <a href="http://localhost:3000/unsubscribe?email={to_email}" style="color: #6366f1;">here</a>.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">PortalAI Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)
