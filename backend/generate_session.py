"""
Generate a Telegram StringSession for cloud deployment.

Run this ONCE locally to authenticate with Telegram and get a session string.
Then set that string as TELEGRAM_SESSION_STRING in your cloud environment.

Usage:
    cd backend
    python generate_session.py

You will be prompted for your phone number and a Telegram login code.
The script outputs a session string - copy it and store it as a secret.
"""

import asyncio
import sys
import os

# Try to load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


async def main():
    try:
        from telethon import TelegramClient
        from telethon.sessions import StringSession
    except ImportError:
        print("ERROR: telethon not installed. Run: pip install telethon")
        sys.exit(1)

    api_id = os.environ.get("TELEGRAM_API_ID") or input("Enter TELEGRAM_API_ID: ").strip()
    api_hash = os.environ.get("TELEGRAM_API_HASH") or input("Enter TELEGRAM_API_HASH: ").strip()

    if not api_id or not api_hash:
        print("ERROR: TELEGRAM_API_ID and TELEGRAM_API_HASH are required.")
        sys.exit(1)

    print("\nStarting Telegram authentication...")
    print("You will receive a login code via Telegram or SMS.\n")

    async with TelegramClient(StringSession(), int(api_id), api_hash) as client:
        await client.start()
        session_string = client.session.save()
        me = await client.get_me()
        print(f"\nAuthenticated as: {me.first_name} (+{me.phone})")

    print("\n" + "=" * 60)
    print("SESSION STRING (copy this entire value):")
    print("=" * 60)
    print(session_string)
    print("=" * 60)
    print()
    print("Next steps:")
    print("  Fly.io:   flyctl secrets set TELEGRAM_SESSION_STRING='<paste here>'")
    print("  Render:   Add as TELEGRAM_SESSION_STRING in dashboard")
    print("  .env:     TELEGRAM_SESSION_STRING=<paste here>")
    print()
    print("WARNING: This session grants full Telegram access. Treat it like a password.")
    print("         Never commit it to git. Never share it.")


if __name__ == "__main__":
    asyncio.run(main())
