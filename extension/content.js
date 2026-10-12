const WRAPPER_CLASS = "ai-reply-wrapper";

// ---------- Reading the email ----------
function getEmailContent() {
  // Gmail puts each message body in an element with class "a3s"
  let nodes = Array.from(document.querySelectorAll(".a3s.aiL"));
  if (nodes.length === 0) nodes = Array.from(document.querySelectorAll(".a3s"));

  // Use the latest message in the thread that has text
  for (let i = nodes.length - 1; i >= 0; i--) {
    const text = nodes[i].innerText.trim();
    if (text) return text;
  }
  return "";
}

// ---------- Finding the reply box ----------
// Walk up from our button until we find a container with an editable textbox
function findComposeBox(startEl) {
  let node = startEl;
  while (node && node !== document.body) {
    const box = node.querySelector('[role="textbox"][g_editable="true"]');
    if (box) return box;
    node = node.parentElement;
  }
  return null;
}

// ---------- Inserting the reply ----------
function insertReply(box, text) {
  box.focus();

  // Put the cursor at the very start so the reply goes above any quoted text
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(box, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);

  document.execCommand("insertText", false, text);
}

// ---------- Building the controls ----------
function makeSelect(options) {
  const select = document.createElement("select");
  select.style.cssText =
    "height:32px;border:1px solid #dadce0;border-radius:6px;padding:0 4px;" +
    "font-size:13px;background:#fff;color:#202124;";
  options.forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
  return select;
}

function createWrapper() {
  const wrap = document.createElement("div");
  wrap.className = WRAPPER_CLASS;
  wrap.style.cssText = "display:inline-flex;align-items:center;gap:6px;margin-left:10px;";

  const notes = document.createElement("input");
  notes.type = "text";
  notes.placeholder = "Your points (optional)";
  notes.style.cssText =
    "height:32px;width:170px;border:1px solid #dadce0;border-radius:6px;" +
    "padding:0 8px;font-size:13px;color:#202124;background:#fff;";

  const tone = makeSelect([
    ["professional", "Professional"],
    ["friendly", "Friendly"],
    ["casual", "Casual"],
    ["concise", "Concise"],
    ["formal", "Formal"],
  ]);

  const greeting = makeSelect([
    ["", "Auto greeting"],
    ["Hello", "Hello"],
    ["Hi", "Hi"],
    ["Hello Sir", "Hello Sir"],
    ["Dear Sir/Madam", "Dear Sir/Madam"],
    ["Hey", "Hey"],
  ]);

  const btn = document.createElement("div");
  btn.textContent = "AI Reply";
  btn.setAttribute("role", "button");
  btn.style.cssText =
    "height:32px;line-height:32px;padding:0 16px;border-radius:16px;" +
    "background:#0b57d0;color:#fff;font-size:13px;font-weight:500;" +
    "cursor:pointer;user-select:none;white-space:nowrap;";

  btn.addEventListener("click", () => handleClick(btn, notes, tone, greeting));

  wrap.append(notes, tone, greeting, btn);
  return wrap;
}

// ---------- Click handler ----------
function handleClick(btn, notesInput, toneSelect, greetingSelect) {
  if (btn.dataset.busy === "1") return;

  const emailContent = getEmailContent();
  if (!emailContent) {
    alert("Could not find the email text. Open an email and click Reply first.");
    return;
  }

  const box = findComposeBox(btn);
  if (!box) {
    alert("Could not find the reply box.");
    return;
  }

  btn.dataset.busy = "1";
  btn.textContent = "Generating...";
  btn.style.background = "#9aa0a6";

  const done = () => {
    btn.dataset.busy = "0";
    btn.textContent = "AI Reply";
    btn.style.background = "#0b57d0";
  };

  try {
    chrome.storage.sync.get("senderName", (data) => {
      chrome.runtime.sendMessage(
        {
          type: "GENERATE_REPLY",
          emailContent,
          notes: notesInput.value.trim(),
          tone: toneSelect.value,
          greeting: greetingSelect.value,
          senderName: data.senderName || "",
        },
        (response) => {
          done();

          if (chrome.runtime.lastError) {
            alert("Extension error: " + chrome.runtime.lastError.message +
                  "\nTry reloading the Gmail tab.");
            return;
          }
          if (!response || response.error) {
            alert("Failed to generate reply: " + (response ? response.error : "no response"));
            return;
          }
          insertReply(box, response.reply);
        }
      );
    });
  } catch (err) {
    done();
    alert("Extension was updated. Please reload this Gmail tab.");
  }
}

// ---------- Adding controls to Gmail ----------
function injectControls() {
  // ".btC" is the bottom toolbar row (with the Send button) of reply/compose boxes
  document.querySelectorAll(".btC").forEach((toolbar) => {
    if (toolbar.querySelector("." + WRAPPER_CLASS)) return;
    toolbar.appendChild(createWrapper());
  });
}

// Gmail loads content dynamically, so watch for changes
let timer = null;
const observer = new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(injectControls, 300);
});
observer.observe(document.body, { childList: true, subtree: true });
injectControls();