const tasks = [
  "День 1: Выбери одну идею, которую давно откладывал, и сделай первый шаг сегодня.",
  "День 2: Выпиши три задачи на день и закрой их любой ценой.",
  "День 3: Откажись от одного «пожирателя времени» на сутки.",
  "День 4: Расскажи кому-то о своём плане — зафиксируй обязательство.",
  "День 5: Закончи одно старое, брошенное дело.",
  "День 6: Сделай неприятное, но полезное действие.",
  "День 7: Анализ недели — что сделал, что мешало?",
  "День 8: 30 минут монотонной работы без отвлечений.",
  "День 9: Начни дневник — 5 минут записи.",
  "День 10: 2 часа фокусной работы по таймеру.",
  "День 11: Изучи что-то нудное, но полезное (финансы/доки).",
  "День 12: Повтори уже сделанную задачу ещё раз — ради практики.",
  "День 13: Развлечения — только после работы.",
  "День 14: Анализ — скука стала легче или труднее?",
  "День 15: Пообещай кому-то результат к конкретной дате.",
  "День 16: Запишись на курс/тренинг с дедлайном.",
  "День 17: Возьми задачу, которую ждут другие/за которую платят.",
  "День 18: Отчитайся перед кем-то о прогрессе.",
  "День 19: Помоги кому-то довести дело до конца.",
  "День 20: Распиши обязательства на месяц вперёд.",
  "День 21: Анализ — что чувствовал, когда нельзя отменить?",
  "День 22: Начни день с самого сложного задания.",
  "День 23: Сделай 5 маленьких шагов по разным проектам.",
  "День 24: Откажись от одной зоны комфорта на день.",
  "День 25: Сделай задачу, которую дольше всего избегал.",
  "День 26: Мини‑проект за один день — придумай и реализуй.",
  "День 27: День без жалоб и отговорок.",
  "День 28: Анализ — что изменилось за месяц?",
  "День 29: Повтори ключевые практики месяца за один день.",
  "День 30: Отпразднуй и зафиксируй план на следующий месяц."
];

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const START_DATE = process.env.START_DATE;      // '2025-08-11'
const TIMEZONE = process.env.TIMEZONE || 'Asia/Bishkek';

if (!BOT_TOKEN || !CHAT_ID || !START_DATE) {
  console.error("Missing env: BOT_TOKEN, CHAT_ID, START_DATE");
  process.exit(1);
}

// Определяем сегодняшний день в нужном поясе без библиотек
function todayInTZ(tz) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  });
  // парсим "дд.мм.гггг"
  const parts = fmt.format(now).split('.');
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  return new Date(Date.UTC(y, m - 1, d)); // полночь UTC соответствующего дня
}

function parseYMD(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const start = parseYMD(START_DATE);
const today = todayInTZ(TIMEZONE);

// разница в днях
const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
let text;

if (diffDays < 0) {
  text = `Старт плана назначен на ${START_DATE}. До старта ${-diffDays} дн.`;
} else if (diffDays < tasks.length) {
  const task = tasks[diffDays];
  text = `Анти‑Puer: ${task}`;
} else {
  text = "30 дней завершены. Обнови цели на следующий месяц и продолжай!";
}

const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const payload = {
  chat_id: CHAT_ID,
  text,
  disable_web_page_preview: true
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

if (!res.ok) {
  const body = await res.text();
  console.error("Telegram API error:", res.status, body);
  process.exit(1);
} else {
  console.log("Message sent:", await res.json());
}
