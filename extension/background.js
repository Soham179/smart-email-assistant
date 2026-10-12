const API_URL = "http://127.0.0.1:8000/api/email/generate/";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GENERATE_REPLY") return;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email_content: msg.emailContent,
      notes: msg.notes || "",
      tone: msg.tone || "professional",
      greeting: msg.greeting || "",
      sender_name: msg.senderName || "",
    }),
  })
    .then(async (res) => {
      const data = await res.json();
      sendResponse(res.ok ? data : { error: data.error || JSON.stringify(data) });
    })
    .catch((err) =>
      sendResponse({ error: "Cannot reach server. Is Django running? (" + err.message + ")" })
    );

  return true; // keeps the message channel open for the async reply
});