// Еженедельный итог: по воскресеньям шлёт шаблон ревью недели + план следующей
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TIMEZONE = process.env.TIMEZONE || 'Asia/Bishkek';

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Missing env: BOT_TOKEN, CHAT_ID");
  process.exit(1);
}

// Дата "сегодня" в часовом поясе TIMEZONE (полночь того дня в UTC)
function todayInTZ(tz) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const [dd, mm, yyyy] = fmt.format(now).split('.');
  return new Date(Date.UTC(+yyyy, +mm - 1, +dd));
}
function pad(n) { return String(n).padStart(2, '0'); }
function fmtDMY(d) { return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth()+1)}.${d.getUTCFullYear()}`; }

const today = todayInTZ(TIMEZONE);
// JS: 0=вс,1=пн,...6=сб
const dow = today.getUTCDay();

// старт недели = понедельник (если сегодня вс=0 → понедельник 6 дней назад; если пн=1 → сегодня)
const daysSinceMonday = (dow + 6) % 7;
const start = new Date(today);
start.setUTCDate(today.getUTCDate() - daysSinceMonday);

// конец недели = воскресенье (старт + 6 дней)
const end = new Date(start);
end.setUTCDate(start.getUTCDate() + 6);

const rangeText = `${fmtDMY(start)} — ${fmtDMY(end)}`;

const template =
`📒 Итоги недели (${rangeText})

1) Победы (min 3):
   • 
   • 
   • 

2) Что не получилось / где буксовал:
   • 
   • 

3) Главное препятствие недели → ближайший шаг, чтобы его снять:
   • Препятствие:
   • Шаг (≤15 мин): 

4) Дисциплина:
   • Анти‑Puer: выполненные дни/30? Что далось тяжелее всего?
   • Фитнес: тренировки/нагрузка/сон —
   • Финансы: траты vs план — 

5) Урок недели в одном предложении:
   • 

🎯 План следующей недели:
   • 3 MIT (Most Important Tasks) — по одному в день пн‑ср:
     1) 
     2) 
     3) 
   • 1 «неприятная» задача — сделаю в понедельник утром:
     • 
   • Награда за выполнение:
     • `;

const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const payload = {
  chat_id: CHAT_ID,
  text: template,
  disable_web_page_preview: true
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
if (!res.ok) {
  console.error("Telegram API error:", res.status, await res.text());
  process.exit(1);
}
console.log("Weekly summary sent");
