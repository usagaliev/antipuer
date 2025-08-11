// Забирает новые апдейты Telegram и пишет траты в data/expenses-YYYY.csv
// Поддержка:
// 1) "1200 еда шаверма" (сумма, категория, опц. заметка)
// 2) Многострочный: начинается со слова "расходы" и далее "Категория - сумма"

import fs from 'fs';
import path from 'path';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TIMEZONE = process.env.TIMEZONE || 'Asia/Bishkek';

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Missing env: BOT_TOKEN, CHAT_ID");
  process.exit(1);
}

const DATA_DIR = 'data';
const STATE_PATH = path.join(DATA_DIR, 'finance-state.json');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
ensureDir(DATA_DIR);

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { last_update_id: 0 };
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return { last_update_id: 0 }; }
}
function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function ymdInTZ(unixSec, tz) {
  const d = new Date(unixSec * 1000);
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  const parts = fmt.formatToParts(d);
  const get = t => parts.find(p => p.type === t)?.value;
  const day = get('day'), month = get('month'), year = get('year');
  const hour = get('hour'), minute = get('minute');
  const isoDate = `${year}-${month}-${day}`;
  const isoTime = `${hour}:${minute}`;
  return { isoDate, isoTime };
}

function csvPathForYear(year) {
  return path.join(DATA_DIR, `expenses-${year}.csv`);
}
function appendCSV(row) {
  const y = row.date.slice(0,4);
  const p = csvPathForYear(y);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, "date,time,amount,category,note,message_id\n", 'utf-8');
  }
  fs.appendFileSync(p, `${row.date},${row.time},${row.amount},${row.category},${row.note},${row.message_id}\n`, 'utf-8');
}

const state = loadState();
const offset = state.last_update_id ? state.last_update_id + 1 : 0;

const updatesUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=10${offset ? `&offset=${offset}` : ''}`;
const r = await fetch(updatesUrl);
if (!r.ok) {
  console.error("getUpdates error:", r.status, await r.text());
  process.exit(1);
}
const data = await r.json();
if (!data.ok) {
  console.error("getUpdates not ok:", data);
  process.exit(1);
}

let maxUpdateId = state.last_update_id || 0;
let saved = 0;

// Старый формат: "1200 еда шаверма"
const rxSingle = /^\s*\+?(\d+(?:[.,]\d{1,2})?)\s+([^\s]+)(?:\s+(.+))?$/i;

for (const upd of data.result) {
  if (upd.update_id > maxUpdateId) maxUpdateId = upd.update_id;
  const msg = upd.message || upd.edited_message;
  if (!msg) continue;
  if (String(msg.chat?.id) !== String(CHAT_ID)) continue; // только нужный чат

  const textRaw = (msg.text || '').trim();
  if (!textRaw) continue;

  const { isoDate, isoTime } = ymdInTZ(msg.date, TIMEZONE);

  // 1) Многострочный формат: начинается со слова "расходы"
  if (/^расходы/i.test(textRaw)) {
    const lines = textRaw.split('\n').slice(1); // убираем первую строку
    for (const line of lines) {
      const m = line.match(/^\s*([^-]+?)\s*-\s*(\d+(?:[.,]\d{1,2})?)\s*$/);
      if (!m) continue;
      const category = m[1].trim().toLowerCase();
      const amount = m[2].replace(',', '.');
      appendCSV({
        date: isoDate,
        time: isoTime,
        amount,
        category,
        note: '""', // пустая заметка
        message_id: msg.message_id
      });
      saved++;
    }
    continue;
  }

  // 2) Старый однострочный формат
  const m = rxSingle.exec(textRaw);
  if (m) {
    const amount = m[1].replace(',', '.');
    const category = m[2].toLowerCase();
    const noteRaw = (m[3] || '').replaceAll(',', ' ').trim();
    const note = `"${noteRaw.replaceAll('"','""')}"`;
    appendCSV({
      date: isoDate,
      time: isoTime,
      amount,
      category,
      note,
      message_id: msg.message_id
    });
    saved++;
  }
}

state.last_update_id = maxUpdateId;
saveState(state);

console.log(`Processed updates: ${data.result.length}, saved entries: ${saved}`);
