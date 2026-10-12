import time

from django.conf import settings
from google import genai
from google.genai import errors, types

client = genai.Client(api_key=settings.GEMINI_API_KEY)

MODELS = [
    settings.GEMINI_MODEL,
    "gemini-3.8-flash-lite",
]

MAX_RETRIES = 3
RETRYABLE_CODES = {429, 500, 503, 504}


def build_prompt(email_content, tone, greeting, notes, sender_name):
    prompt = (
        "You are a smart email assistant. Write a reply to the email below.\n"
        "Rules:\n"
        "- Return only the email body, no subject line.\n"
        "- Always start with a greeting line.\n"
        "- Address every question or request in the original email. If the "
        "user's notes do not answer something, say the user will follow up "
        "on it; never ignore it.\n"
        "- Do not use placeholders like [Your Name] or [Time].\n"
        "- Do not invent facts, times, or commitments that are not in the "
        "user's notes.\n"
        "- Keep it short: under 120 words unless the email needs more.\n"
    )

    if tone:
        prompt += f"- Use a {tone} tone.\n"

    if greeting:
        prompt += (
            f"- Begin with the greeting \"{greeting}\" (add the sender's name "
            "only if it appears in the email).\n"
        )
    else:
        prompt += (
            "- Choose a greeting that fits the tone (e.g. Hello or Hi), and "
            "include the sender's name only if it appears in the email.\n"
        )

    if notes:
        prompt += (
            "- The user wants the reply to say this (base the reply on it): "
            f"{notes}\n"
        )

    if sender_name:
        prompt += f"- End with a sign-off followed by the name \"{sender_name}\".\n"
    else:
        prompt += "- End with a short sign-off such as \"Best regards,\" and no name.\n"

    prompt += f"\nOriginal email:\n{email_content}"
    return prompt


def _call_model(model, prompt):
    fast_config = types.GenerateContentConfig(
        temperature=0.7,
        max_output_tokens=600,
        thinking_config=types.ThinkingConfig(thinking_budget=0),  # no extra reasoning
    )
    try:
        return client.models.generate_content(
            model=model, contents=prompt, config=fast_config
        )
    except errors.APIError as e:
        if e.code == 400:
            # This model doesn't accept the thinking setting; use defaults
            return client.models.generate_content(model=model, contents=prompt)
        raise


def generate_email_reply(email_content, tone="", greeting="", notes="", sender_name=""):
    prompt = build_prompt(email_content, tone, greeting, notes, sender_name)

    last_error = None

    for model in MODELS:
        for attempt in range(MAX_RETRIES):
            start = time.time()
            try:
                response = _call_model(model, prompt)
                print(f"[{model}] took {time.time() - start:.1f}s")
                return (response.text or "").strip()
            except errors.APIError as e:
                last_error = e
                print(f"[{model}] attempt {attempt + 1} failed: {e.code}")
                if e.code in RETRYABLE_CODES:
                    time.sleep(1 + attempt)  # waits 1s, 2s, 3s
                    continue
                if e.code == 404:
                    break
                raise

    raise last_error