// Читает CSV за текущий год, считает итоги за неделю (по TIMEZONE) и шлёт сводку
import fs from 'fs';
import path from 'path';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TIMEZONE = process.env.TIMEZONE || 'Asia/Bishkek';

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Missing env: BOT_TOKEN, CHAT_ID");
  process.exit(1);
}

function fmtDMY(d) {
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth()+1)}.${d.getUTCFullYear()}`;
}
function todayInTZ(tz) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const [dd, mm, yyyy] = fmt.format(now).split('.');
  return new Date(Date.UTC(+yyyy, +mm - 1, +dd));
}

const today = todayInTZ(TIMEZONE);
const dow = today.getUTCDay();                // 0=вс
const daysSinceMonday = (dow + 6) % 7;        // пн=0
const weekStart = new Date(today); weekStart.setUTCDate(today.getUTCDate() - daysSinceMonday);
const weekEnd   = new Date(weekStart); weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

const rangeText = `${fmtDMY(weekStart)} — ${fmtDMY(weekEnd)}`;

const year = weekStart.getUTCFullYear();
const CSV = path.join('data', `expenses-${year}.csv`);
if (!fs.existsSync(CSV)) {
  console.log("No expenses file for this year");
  process.exit(0);
}

const lines = fs.readFileSync(CSV, 'utf-8').trim().split('\n');
const header = lines.shift(); // date,time,amount,category,note,message_id

function inWeek(dYMD) {
  const [y,m,d] = dYMD.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m-1, d));
  return dt >= weekStart && dt <= weekEnd;
}

let total = 0;
const byCat = {};
let count = 0;

for (const ln of lines) {
  const [date, time, amount, category, note, message_id] = ln.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/); // CSV без библиотек
  if (!inWeek(date)) continue;
  const val = parseFloat(amount);
  if (!isFinite(val)) continue;
  total += val;
  byCat[category] = (byCat[category] || 0) + val;
  count++;
}

const catLines = Object.entries(byCat)
  .sort((a,b) => b[1]-a[1])
  .map(([c, v]) => `• ${c}: ${v.toFixed(2)}`)
  .join('\n') || '• (нет данных)';

const text =
`📊 Итоги расходов за неделю (${rangeText})
Записей: ${count}
Итого: ${total.toFixed(2)}

По категориям:
${catLines}

Совет: выдели 1 категорию-пожиратель и урежь её на 20% на следующей неделе.`;

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
console.log("Weekly finance summary sent");
