document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const params = new URLSearchParams(window.location.search);
  const currentUser = params.get("user");

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const aiDiv = document.getElementById("ai-replies");
  const backBtn = document.getElementById("back-btn");

  // Initialize WhatsApp client for this user
  socket.emit("init-client", { username: currentUser });

  // Load existing AI replies from server
  socket.on("load-ai-replies", (replies) => {
    aiDiv.innerHTML = ""; // clear
    replies.reverse().forEach(msg => {
      const p = document.createElement("p");
      p.innerText = msg;
      aiDiv.appendChild(p);
    });
  });

  // Listen for new AI replies in real-time
  socket.on("ai-reply", (msg) => {
    const p = document.createElement("p");
    p.innerText = msg;
    aiDiv.prepend(p); // newest on top
  });

  // Back to dashboard
  backBtn.addEventListener("click", () => {
    window.location.href = `dashboard.html?user=${currentUser}`;
  });
});
