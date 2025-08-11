// Ежедневный пинг учёта расходов (22:00 Бишкек)
// Формат ответа боту: "1200 еда шаверма", "350 транспорт такси", "99 дом лампочка"
// Сумма + категория (одно слово) + опциональная заметка

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Missing env: BOT_TOKEN, CHAT_ID");
  process.exit(1);
}

const text =
  "💰 Финансовый контроль\n" +
  "Ответь одним сообщением: «СУММА КАТЕГОРИЯ [заметка]»\n" +
  "Примеры: 1200 еда шаверма; 350 транспорт такси; 99 дом лампочка\n" +
  "Категории: еда, транспорт, дом, здоровье, связь, подписки, развлечения, одежда, подарки, др.";

const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const payload = { chat_id: CHAT_ID, text, disable_web_page_preview: true };

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
if (!res.ok) {
  console.error("Telegram API error:", res.status, await res.text());
  process.exit(1);
}
console.log("Finance reminder sent");
