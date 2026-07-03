/* ---------- Chat elements ---------- */
const input = document.getElementById('chatInput');
const button = document.getElementById('sendBtn');
const chatBox = document.querySelector(".chat-box");

/* ---------- Auth guard ---------- */
auth.onAuthStateChanged(function (user) {
  if (!user) {
    window.location.href = "login.html";
    return;
  } else {
  chatBox.style.display = "block";
}
  document.getElementById('userGreeting').textContent = "Hi, " + (user.displayName || user.email) + " · ";
  loadHistory(user.uid);
  button.disabled = false;
});

document.getElementById('logoutLink').addEventListener('click', function (e) {
  e.preventDefault();
  auth.signOut().then(function () {
    window.location.href = "login.html";
  });
});

/* Plain collection reference - used for WRITING (add) */
function messagesCollection(uid) {
  return db.collection('users').doc(uid).collection('messages');
}

/* Ordered query - used for READING (onSnapshot / get) */
function messagesQuery(uid) {
  return messagesCollection(uid).orderBy('timestamp', 'asc');
}

function loadHistory(uid) {
  messagesQuery(uid).onSnapshot(function (snap) {
    chatBox.innerHTML = '';
    if (snap.empty) {
      chatBox.innerHTML = `<div class="bot-message">👋 Hello! I am BenChat AI. How can I help you today?</div>`;
      return;
    }
    snap.forEach(function (doc) {
      const m = doc.data();
      appendMessage(m.sender, m.text);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

function appendMessage(sender, text) {
  if (sender === 'user') {
    chatBox.innerHTML += `
    <div style="
    background:#38bdf8;
    color:white;
    padding:15px;
    margin-top:15px;
    border-radius:12px;
    text-align:right;">
        ${text}
    </div>
    `;
  } else {
    chatBox.innerHTML += `
    <div class="bot-message">
        ${text}
    </div>
    `;
  }
}

/* ---------- Send message ---------- */
button.onclick = async function () {
  const user = auth.currentUser;
  if (!user) return;

  let message = input.value.trim();
  if (message === "") return;
  input.value = "";

  button.disabled = true;
  button.textContent = "Sending...";

  try {
    await messagesCollection(user.uid).add({
      sender: 'user',
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    button.textContent = "Thinking...";
    const reply = await generateReply(message, user.uid);

    await messagesCollection(user.uid).add({
      sender: 'ai',
      text: reply,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    alert("Send failed: " + err.message);
  } finally {
    button.disabled = false;
    button.textContent = "Send";
  }
};

/* =========================================================
   AI REPLY ENGINE - powered by Groq (free tier, OpenAI-compatible)
   ========================================================= */
const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function generateReply(userText, uid) {
  if (GROQ_API_KEY) {
    try {
      const history = await recentHistory(uid);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: "You are BenChat AI, a friendly assistant built for a university project by Wisdom. Keep answers concise and helpful." },
            ...history,
            { role: "user", content: userText }
          ],
          max_tokens: 400
        })
      });
      if (!response.ok) throw new Error("Groq request failed: " + response.status);
      const data = await response.json();
      const text = data.choices && data.choices[0] && data.choices[0].message.content.trim();
      if (text) return text;
      throw new Error("Empty response from Groq");
    } catch (err) {
      console.error("Falling back to offline responder:", err);
      return offlineReply(userText);
    }
  }
  return offlineReply(userText);
}

async function recentHistory(uid) {
  const all = await messagesQuery(uid).get();
  const docs = all.docs.slice(-10);
  return docs.map(function (doc) {
    const m = doc.data();
    return { role: m.sender === 'user' ? 'user' : 'assistant', content: m.text };
  });
}

/* ---------- Offline fallback (your original bot logic) ---------- */
function offlineReply(message) {
  const text = message.toLowerCase();

  if (text === "hi" || text === "hello") return "👋 Hello! Welcome to BenChat AI.";
  if (text === "how are you") return "😊 I'm doing great! Thanks for asking.";
  if (text === "who made you") return "❤️ I was created by Wisdom as a university project.";
  if (text === "your name" || text.includes("what is your name")) return "🤖 My name is BenChat AI.";
  if (text.includes("good morning")) return "☀️ Good morning! I hope you have a wonderful day.";
  if (text.includes("good afternoon")) return "🌤️ Good afternoon! How can I help you today.";
  if (text.includes("good night")) return "🌙 Good night! Sleep well.";
  if (text.includes("thank")) return "❤️ You're welcome!";
  if (text.includes("bye")) return "👋 Goodbye! See you again.";
  if (text.includes("ghana")) return "🇬🇭 Ghana is a beautiful country in West Africa.";
  if (text.includes("university")) return "🎓 I can help you with your university studies.";
  if (text.includes("math")) return "➗ I love mathematics! Ask me a math question.";
  if (text.includes("science")) return "🔬 Science helps us understand the world around us.";
  return "🤖 I'm still learning. Add an OpenAI key in script.js and I'll be able to answer almost anything!";
}
