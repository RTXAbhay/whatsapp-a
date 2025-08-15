async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Enter username and password");

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();

  if (data.success) {
    // Redirect to dashboard with username in query
    window.location.href = `dashboard.html?user=${username}`;
  } else {
    document.getElementById("status").innerText = data.msg;
  }
}

async function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const secret = document.getElementById("secret").value.trim();

  if (!username || !password || !secret) return alert("Enter all fields");

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, secret })
  });

  const data = await res.json();
  document.getElementById("status").innerText = data.msg || (data.success ? "Registration successful!" : "");
}
