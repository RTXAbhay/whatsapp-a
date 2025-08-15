require('dotenv').config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs-extra");
const { CohereClient } = require("cohere-ai");
const qrcode = require("qrcode");

// Initialize Cohere client
const co = new CohereClient({ apiKey: process.env.CO_API_KEY });

const SESSIONS_DIR = "./sessions";
const MESSAGES_FILE = "./messages.json";

let clients = {};

/**
 * Initialize WhatsApp client per user
 */
async function initWhatsAppClient(username, socket) {
  if (clients[username]) return clients[username];

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: username, dataPath: SESSIONS_DIR }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu"
      ]
      // No executablePath needed; Puppeteer handles Chromium automatically
    }
  });

  // QR code generation
  client.on("qr", async (qr) => {
    try {
      const qrImage = await qrcode.toDataURL(qr);
      socket.emit("qr", { qr: qrImage, user: username });
    } catch (err) {
      console.error("QR generation error:", err);
    }
  });

  // WhatsApp ready
  client.on("ready", () => {
    console.log(username + " WhatsApp Ready");
    socket.emit("ready", { user: username });
    socket.emit("login-successful", { name: client.info.pushname || username });
  });

  // Authenticated
  client.on("authenticated", () => {
    console.log(username + " Authenticated");
  });

  // Disconnected / Error handling
  client.on("disconnected", (reason) => {
    console.log(username + " disconnected:", reason);
    delete clients[username];
  });

  client.on("auth_failure", (msg) => {
    console.error(username + " auth failure:", msg);
    socket.emit("client-error", { msg: "WhatsApp authentication failed" });
  });

  // Message handler
  client.on("message", async (msg) => {
    if (!msg.body || msg.body.trim() === "") return;

    const messages = fs.existsSync(MESSAGES_FILE) ? fs.readJsonSync(MESSAGES_FILE) : {};
    const userMsgs = messages[username] || {};
    if (!userMsgs[msg.from]) userMsgs[msg.from] = [];

    if (!userMsgs[msg.from].includes(msg.id._serialized)) {
      userMsgs[msg.from].push(msg.id._serialized);
      fs.writeJsonSync(MESSAGES_FILE, { ...messages, [username]: userMsgs });

      const usersData = fs.existsSync("./users.json") ? fs.readJsonSync("./users.json") : {};
      const userSettings = usersData[username] || {};
      const toggleCurrent = userSettings.toggles?.current ?? true;

      if (toggleCurrent) {
        const instructions = userSettings.instructions || "";
        try {
          const reply = await sendAIReply(msg.body, instructions);
          await client.sendMessage(msg.from, reply);
          socket.emit("ai-reply", `Reply sent to ${msg.from}: ${reply}`);
        } catch (err) {
          console.error("Error sending AI reply:", err);
          socket.emit("ai-reply", `Failed to reply to ${msg.from}`);
        }
      }
    }
  });

  try {
    await client.initialize();
    clients[username] = client;
  } catch (err) {
    console.error("WhatsApp client init failed:", err.message);
    socket.emit("client-error", { msg: err.message });
  }

  return client;
}

/**
 * Send message to Cohere AI and get reply
 */
async function sendAIReply(message, instructions) {
  if (!message || message.trim() === "") return "No message received";

  try {
    const response = await co.chat({
      model: "command",
      message: `${instructions}\nUser: ${message}`,
      max_tokens: 200
    });

    if (response?.text) return response.text;
    return "No reply generated";

  } catch (err) {
    console.error("Cohere Chat API error:", err);
    return "Error generating reply";
  }
}

module.exports = { initWhatsAppClient, sendAIReply, clients };
