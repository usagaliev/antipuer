const tasks = [
  "Хватит ждать. Выбери одну идею, которую откладывал, и сделай первый шаг. (Пример: заведи блог и напиши первый пост).",
  "Выпиши 3 задачи на день и закрой их любой ценой. (Пример: купить лампочку, позвонить клиенту, отправить отчёт).",
  "Убей пожирателя времени на сутки. (Пример: удали YouTube с телефона).",
  "Зафиксируй обязательство — расскажи кому-то о плане. (Пример: пообещай другу результат к дате).",
  "Закрой старый хвост. (Пример: доделай ремонт полки, оформи документ).",
  "Сделай неприятное, но полезное. (Пример: запишись к врачу, выкинь хлам).",
  "Анализ. Что сделал, что мешало, какие были отмазки.",
  "30 минут монотонной работы без отвлечений. (Пример: рассортируй фото или файлы).",
  "Начни дневник — 5 минут записи. (Пример: что сделал, чему научился, что планируешь).",
  "2 часа фокусной работы. Без соцсетей и отвлечений.",
  "Изучи что-то нудное, но полезное. (Пример: инструкция к софту, модуль курса).",
  "Повтори уже сделанную задачу — ради закрепления.",
  "Развлечения только после работы. (Пример: Netflix или игры — только вечером).",
  "Анализ. Скука стала легче или тяжелее?",
  "Пообещай результат к дате. (Пример: «Сделаю к пятнице»).",
  "Запишись на курс/тренинг с дедлайном.",
  "Возьми задачу, которую ждут другие/за которую платят.",
  "Отчитайся перед кем-то о прогрессе. (Пример: пришли скриншоты или фото).",
  "Помоги кому-то довести дело до конца.",
  "Распиши обязательства на месяц вперёд (с датами).",
  "Анализ. Что чувствовал, когда отменить было нельзя?",
  "Начни день с самой сложной задачи.",
  "5 маленьких шагов по разным проектам.",
  "Откажись от зоны комфорта на день. (Пример: без кофе или без такси).",
  "Сделай задачу, которую дольше всего избегал.",
  "Мини-проект за один день. (Пример: бот, прототип, рассказ).",
  "День без жалоб и отговорок.",
  "Анализ. Что изменилось за месяц?",
  "Повтори лучшие практики месяца за один день.",
  "Отпразднуй и зафиксируй новый план."
];

const quotes = [
  "🔥 Дело сделает себя только руками того, кто начал.",
  "🚀 Не думай, действуй. Думать будем потом.",
  "🏆 Результат — это побочный эффект дисциплины.",
  "⚡ Каждая отмазка отодвигает тебя от цели.",
  "🛠 Маленькие шаги строят большие перемены.",
  "🦾 Сегодняшнее усилие — завтрашняя гордость.",
  "🗡 Делай то, что страшно, и страх исчезнет.",
  "🌱 Постоянство сильнее вдохновения."
];

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const START_DATE = process.env.START_DATE; // '2025-08-11'
const TIMEZONE = process.env.TIMEZONE || 'Asia/Bishkek';

if (!BOT_TOKEN || !CHAT_ID || !START_DATE) {
  console.error("Missing env: BOT_TOKEN, CHAT_ID, START_DATE");
  process.exit(1);
}

// Определяем сегодняшний день в нужном поясе
function todayInTZ(tz) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = fmt.format(now).split('.');
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  return new Date(Date.UTC(y, m - 1, d));
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
  const dayNum = diffDays + 1; // нумерация с 1
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  text = `День ${dayNum}/${tasks.length}: ${tasks[diffDays]}\n\n${quote}`;
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
