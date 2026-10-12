const nameInput = document.getElementById("name");
const status = document.getElementById("status");

chrome.storage.sync.get("senderName", (data) => {
  nameInput.value = data.senderName || "";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({ senderName: nameInput.value.trim() }, () => {
    status.innerText = "Saved!";
    setTimeout(() => (status.innerText = ""), 1500);
  });
});