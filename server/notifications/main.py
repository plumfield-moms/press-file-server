import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from pathlib import Path
import os
import asyncio
import server.database.notifications as db
import server.filesystem.main as filesystem

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465  # Secure SSL port
SENDER_EMAIL = "plumfieldmoms@gmail.com"
APP_PASSWORD = os.getenv("GMAIL_PASSWORD")
ED_EMAIL = os.getenv("ED_EMAIL")


def send_email(to, proof: str, name: str):
    if APP_PASSWORD == None:
        raise ValueError("Missing Gmail Password")

    message = MIMEMultipart()
    message["From"] = SENDER_EMAIL
    message["To"] = to
    message["Subject"] = f"{name.title()}, {proof.title()} is ready for you to proof!"
    body = f"Hello! {proof.title()} is awaiting your approval!\nhttps://server.plumfieldpress.com"
    message.attach(MIMEText(body, "plain"))
    try:
        # 3. Establish a secure connection and send the email
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, to, message.as_string())
        print(f"[EMAIL] Email sent to {name.title()} for proof {proof.title()}")

    except Exception as e:
        print(f"An error occurred: {e}")


async def notify_ed_loop():
    if ED_EMAIL == False:
        raise ValueError("Missing ED_EMAIL")

    while True:
        await asyncio.sleep(15)
        proofs = await asyncio.to_thread(filesystem.get_all_proofs)
        for pr in proofs:
            pr_id = pr["id"]

            if pr["stage"] != "ed":
                continue

            is_notified = await asyncio.to_thread(db.is_ed_notified, pr_id)
            if is_notified:
                continue

            try:
                await asyncio.to_thread(send_email, ED_EMAIL, pr_id, "Ed")
                await asyncio.to_thread(db.mark_ed_notified, pr_id)
            except Exception as e:
                print(e)
