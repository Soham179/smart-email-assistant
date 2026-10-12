
@"
# Smart Email Assistant

AI email reply generator built with Django REST Framework and the Google Gemini API, with a Chrome extension that adds an "AI Reply" button inside Gmail.

## Features
- Generates replies with selectable tone, greeting, and key points
- Editable reply box with Copy and Regenerate in the web UI
- Chrome extension (Manifest V3) for Gmail
- Retries and fallback model for API rate limits and outages

## Tech Stack
Python, Django, Django REST Framework, Google Gemini API, JavaScript, HTML/CSS

## Setup
1. python -m venv venv
2. venv\Scripts\activate
3. pip install -r requirements.txt
4. Copy .env.example to .env and add your Gemini API key
5. python manage.py runserver
6. Open chrome://extensions, enable Developer mode, click Load unpacked, and choose the extension folder
"@ | Set-Content README.md

git add README.md
git commit -m "Update README"
git push
