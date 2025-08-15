const socket = io();
let currentUser = "";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  currentUser = params.get("user");
  if (!currentUser) window.location.href = "index.html";

  socket.emit("init-client", { username: currentUser });

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

socket.on("qr", (data) => {
  if (data.user === currentUser) {
    document.getElementById("qr-img").src = data.qr;
    document.getElementById("qr-status").innerText = "Scan this QR from your WhatsApp phone app";
  }
});

socket.on("login-successful", (data) => {
  document.getElementById("login-status").innerText = `Login Successful! WhatsApp: ${data.name}`;
});

socket.on("ai-reply", (msg) => {
  const div = document.getElementById("ai-replies");
  const p = document.createElement("p");
  p.innerText = msg;
  div.prepend(p);
});

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

function reloadQR() {
  socket.emit("init-client", { username: currentUser });
}

async function logoutWA() {
  try {
    const res = await fetch("/logoutWhatsApp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser }),
    });
    const data = await res.json();
    if (data.success) {
      alert("WhatsApp session logged out successfully!");
      location.reload();
    } else alert("Logout failed: " + data.msg);
  } catch (err) {
    console.error(err);
    alert("Error logging out WhatsApp");
  }
}

document.getElementById("logout-wa-btn").addEventListener("click", logoutWA);
function goToAIReplies() {
  window.location.href = `ai-replies.html?user=${currentUser}`;
}
