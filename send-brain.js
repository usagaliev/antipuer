const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Missing env: BOT_TOKEN, CHAT_ID");
  process.exit(1);
}

const text = "🧩 Разгрузка мозга: Что тебя сегодня беспокоило? Запиши в ответ, чтобы отпустить это.";

const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const payload = { chat_id: CHAT_ID, text };

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

if (!res.ok) {
  console.error("Telegram API error:", res.status, await res.text());
  process.exit(1);
}
console.log("Brain unload reminder sent");
