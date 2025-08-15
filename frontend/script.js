const socket = io();
let currentUser = "";

// --- Dashboard setup ---
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  currentUser = params.get("user");
  if (!currentUser) window.location.href = "index.html";

  socket.emit("init-client", { username: currentUser });

  // Load toggles and instructions from server
  fetch("/users.json")
    .then(res => res.json())
    .then(users => {
      if (users[currentUser]) {
        document.getElementById("instructions").value = users[currentUser].instructions || "";
        const toggles = users[currentUser].toggles || { current: true, previous: true };
        document.getElementById("toggle-new").checked = toggles.current;
        document.getElementById("toggle-old").checked = toggles.previous;
      }
    });
});

// QR code updates
socket.on("qr", (data) => {
  if (data.user === currentUser) {
    document.getElementById("qr-img").src = data.qr;
    document.getElementById("qr-status").innerText = "Scan this QR from your WhatsApp phone app";
  }
});

// WhatsApp ready / login successful
socket.on("ready", (data) => {
  if (data.user === currentUser) {
    document.getElementById("qr-status").innerText = "WhatsApp Ready!";
  }
});

socket.on("login-successful", (data) => {
  document.getElementById("login-status").innerText = `Login Successful! WhatsApp: ${data.name}`;
});

// AI replies
socket.on("ai-reply", (msg) => {
  const div = document.getElementById("ai-replies");
  const p = document.createElement("p");
  p.innerText = msg;
  div.prepend(p);
});

// --- Save instructions & toggles ---
async function saveInstructions() {
  const instructions = document.getElementById("instructions").value;
  await fetch("/saveInstructions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, instructions })
  });
  alert("Instructions saved!");
}

async function saveToggles() {
  const toggles = {
    current: document.getElementById("toggle-new").checked,
    previous: document.getElementById("toggle-old").checked
  };
  await fetch("/saveToggles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, toggles })
  });
}

// Reload QR
function reloadQR() {
  socket.emit("init-client", { username: currentUser });
}

// Logout
function logout() {
  window.location.href = "index.html";
}
