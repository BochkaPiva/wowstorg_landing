import type { LandingContentDraft } from "@entities/admin/model";

const STORAGE_KEY = "wowstorg:admin-content-draft:v3";
const PREVIOUS_STORAGE_KEY = "wowstorg:admin-content-draft:v2";
const LEGACY_STORAGE_KEY = "wowstorg:admin-content-draft:v1";

export const defaultLandingContentDraft: LandingContentDraft = {
  version: 3,
  updatedAt: "",
  seo: {
    title: "ВАУСТОРГ — event-агентство и тимбилдинги в Омске",
    description: "Корпоративы, тимбилдинги, welcome-зоны и игровой реквизит в Омске. Разрабатываем механику, комплектуем площадку и проводим событие под ключ.",
  },
  hero: {
    eyebrow: "Event-агентство · Омск",
    title: "События, которые",
    accent: "собирают людей.",
    description: "Корпоративы, тимбилдинги и игровые зоны в Омске. Придумываем механику, привозим реквизит и ведём событие от первого гостя до финала.",
    ctaLabel: "Обсудить проект",
    videoPath: "/hero.mp4",
  },
  trust: {
    label: "Нам доверяют",
    items: [],
  },
  formats: {
    eyebrow: "Что можно заказать",
    title: "Форматы мероприятий.",
    summary: "От готового тимбилдинга до полного оснащения площадки и события под ключ.",
    catalogNote: "Пакеты тимбилдингов, welcome-зоны, игровые зоны и отдельный реквизит собраны в самостоятельном каталоге.",
    catalogCtaLabel: "Открыть каталог",
    items: [
      { title: "Тимбилдинги", text: "Командный сюжет вместо набора конкурсов: от знакомства до общего финала.", note: "20–500 гостей" },
      { title: "Welcome-зоны", text: "Игровой первый контакт, который занимает гостей и запускает общение.", note: "готовые и брендированные" },
      { title: "Игровые зоны", text: "Станции, гигантские игры и реквизит — отдельно или комплектом на площадку.", note: "аренда и проведение" },
      { title: "События под ключ", text: "Сценарий, команда, логистика, монтаж и проведение в одной ответственности.", note: "Омск и выездные проекты" },
    ],
  },
  catalogGateway: {
    eyebrow: "Цифровой каталог ВАУСТОРГ",
    title: "Каталог решений",
    accent: "и реквизита.",
    description: "Выберите готовый формат или соберите собственную подборку. Всё выбранное сохранится и прикрепится к заявке.",
    ctaLabel: "Перейти в каталог",
    sections: [
      { id: "team", index: "01", tab: "Тимбилдинги", title: "Тимбилдинги", subtitle: "Готовые командные программы со сценарием и общим финалом.", description: "Раздел для цельных форматов, которые можно изучить, сравнить и добавить в подборку." },
      { id: "welcome", index: "02", tab: "Welcome-зоны", title: "Welcome-зоны", subtitle: "Первое действие начинается раньше основной программы.", description: "Комплекты коротких механик для встречи гостей, свободного общения и мягкого включения в событие." },
      { id: "spaces", index: "03", tab: "Игровые зоны", title: "Игровые зоны", subtitle: "Несколько точек работают как единая среда.", description: "Зоны для корпоративов, фестивалей и выставок: гости свободно перемещаются, а команда держит ритм." },
      { id: "props", index: "04", tab: "Реквизит", title: "Реквизит", subtitle: "Когда сценарий уже есть, остаётся собрать точный состав.", description: "Оцифрованные позиции с описанием, фотографиями, комплектацией и доступностью на выбранные даты." },
    ],
  },
  cases: {
    eyebrow: "Портфолио",
    title: "Реализованные события.",
    description: "Выберите направление. Внутри — отдельные проекты с фотографиями, задачей, механикой и результатом.",
    collections: [
      { title: "Тимбилдинги", meta: "Реализованные командные программы", code: "TEAM", projects: [] },
      { title: "Welcome-зоны", meta: "Проекты для встречи и вовлечения гостей", code: "WELCOME", projects: [] },
      { title: "Игровые зоны", meta: "Игровые пространства на событиях", code: "PLAY", projects: [] },
    ],
  },
  story: {
    label: "Как создаём событие",
    scenes: [
      { title: "Вы приходите с задачей.", text: "Познакомить команду, занять гостей до начала программы, оживить стенд или собрать большое корпоративное событие. Нам достаточно понять, кого вы приглашаете и что должно измениться после встречи.", aside: "Можно без готового ТЗ — начнём с короткого разговора.", align: "left", action: null },
      { title: "Мы собираем сценарий.", text: "Выстраиваем путь гостя: что он замечает первым, где включается в игру и к какому общему моменту приходит команда. Сценарий учитывает площадку, тайминг и характер аудитории.", aside: "Каждая механика получает понятную роль в событии.", align: "right", action: null },
      { title: "Подбираем формат.", text: "Собираем нужную комплектацию из игровых станций, крупного реквизита, ведущих и брендированных элементов. Можно выбрать готовый пакет или адаптировать механику под вашу задачу.", aside: "", align: "left", action: { label: "Открыть каталог", href: "/catalog" } },
      { title: "Привозим и проводим.", text: "Готовим реквизит и команду, доставляем всё на площадку, монтируем зоны и держим темп во время события. Вам не приходится координировать несколько подрядчиков.", aside: "Одна ответственность за механику, логистику и проведение.", align: "right", action: null },
      { title: "В финале остаётся общее.", text: "Не просто фотографии с площадки, а момент, который команда прожила вместе. После короткого брифа предложим формат, состав механик и план подготовки.", aside: "", align: "right", action: { label: "Обсудить событие", href: "#brief" } },
    ],
  },
  faq: {
    title: "Частые вопросы",
    items: [
      { question: "Вы работаете только в Омске?", answer: "Основная база в Омске. Для выездных проектов обсуждаем логистику, состав реквизита и команду отдельно." },
      { question: "Можно арендовать только реквизит?", answer: "Да. Но мы все равно уточняем площадку и сценарий, чтобы реквизит не стоял в углу, а работал на событие." },
      { question: "Сколько времени нужно на подготовку?", answer: "Готовую игровую зону можно собрать быстрее. Для брендированной или кастомной механики нужен запас на сценарий, производство и согласование." },
      { question: "Подойдет для офиса или маленькой площадки?", answer: "Да. Для камерных событий подбираем компактные станции, настольные механики и задания на командное взаимодействие." },
    ],
  },
  leadForm: {
    eyebrow: "Заявка на мероприятие",
    title: "Обсудить мероприятие.",
    description: "Три факта о задаче и контакт. Вернёмся с подходящим форматом, а не общей презентацией.",
    eventTypes: ["Тимбилдинг", "Корпоратив", "Welcome-зона", "Выставка / промо", "Аренда реквизита", "Нужна идея"],
    guestRanges: ["До 30", "30–80", "80–200", "Больше 200", "Пока не знаем"],
    contactTypes: ["Телефон", "Email", "MAX"],
  },
  contacts: {
    email: "wowstorg@mail.ru",
    phones: ["+7 950 784-31-92", "+7 983 404-10-73"],
    city: "Омск",
  },
  legal: {
    privacy: {
      title: "Политика обработки персональных данных",
      status: "Перед публикацией заполните реквизиты оператора: полное наименование, ИНН, ОГРН и юридический адрес.",
      introduction: "Настоящая политика определяет порядок обработки и защиты персональных данных посетителей сайта ВАУСТОРГ.",
      revision: "Редакция от 13 июля 2026 года.",
      sections: [
        { title: "1. Оператор", body: "Оператором персональных данных является ВАУСТОРГ. Контакт для обращений по вопросам обработки данных: wowstorg@mail.ru. Юридические реквизиты оператора необходимо указать перед публикацией документа." },
        { title: "2. Какие данные обрабатываются", body: "Имя, компания, телефон, адрес электронной почты, выбранный способ связи, сведения о планируемом мероприятии, содержимое заявки и технические данные, необходимые для безопасной работы сайта." },
        { title: "3. Цели обработки", body: "Обработка заявки, связь с пользователем, подготовка предложения, исполнение договорных обязательств, обеспечение безопасности сайта и соблюдение требований законодательства Российской Федерации." },
        { title: "4. Правовые основания", body: "Согласие субъекта персональных данных, действия по запросу пользователя до заключения договора, исполнение договора и обязанности оператора, установленные законом." },
        { title: "5. Действия и сроки", body: "Данные могут собираться, записываться, систематизироваться, храниться, уточняться, использоваться, передаваться уполномоченным обработчикам и удаляться. Срок хранения определяется целью обработки и требованиями закона." },
        { title: "6. Передача и хранение", body: "Доступ к данным получают только лица и сервисы, которым он необходим для обработки заявки и работы сайта. Передача третьим лицам для самостоятельного маркетинга не производится." },
        { title: "7. Права пользователя", body: "Пользователь вправе запросить сведения об обработке, уточнение, блокирование или удаление данных, а также отозвать согласие, направив обращение на wowstorg@mail.ru." },
        { title: "8. Защита данных", body: "Оператор применяет организационные и технические меры защиты, разграничение доступа, журналирование действий и безопасные каналы передачи данных." },
      ],
    },
    personalData: {
      title: "Согласие на обработку персональных данных",
      status: "Согласие действует только в отношении данных, переданных через форму сайта.",
      introduction: "Отправляя форму, пользователь свободно, своей волей и в своём интересе даёт согласие ВАУСТОРГ на обработку указанных персональных данных.",
      revision: "Редакция от 13 июля 2026 года.",
      sections: [
        { title: "Данные", body: "Имя, компания, контактные данные, предпочтительный способ связи, сведения о мероприятии и иная информация, которую пользователь добровольно сообщает в заявке." },
        { title: "Цель", body: "Рассмотрение обращения, подготовка предложения, обратная связь, согласование мероприятия и последующее исполнение договорённостей." },
        { title: "Действия", body: "Сбор, запись, систематизация, накопление, хранение, уточнение, использование, передача уполномоченным обработчикам, блокирование и удаление данных с применением автоматизированных средств или без них." },
        { title: "Срок и отзыв", body: "Согласие действует до достижения целей обработки или до его отзыва. Отозвать согласие можно письмом на wowstorg@mail.ru. Отзыв не влияет на законность обработки, выполненной до его получения." },
      ],
    },
    cookies: {
      title: "Cookie и локальное хранилище",
      status: "",
      introduction: "Сайт использует необходимые технические данные браузера и локальное хранилище для работы интерфейса, корзины каталога и сохранения выбора пользователя.",
      revision: "Редакция от 13 июля 2026 года.",
      sections: [
        { title: "Необходимые технологии", body: "Они обеспечивают навигацию, защиту формы, работу корзины и запоминают выбор cookie. Без них отдельные функции сайта могут быть недоступны." },
        { title: "Необязательная аналитика", body: "Аналитические cookie и похожие технологии включаются только после согласия пользователя и помогают оценивать посещаемость и улучшать сайт." },
        { title: "Как изменить выбор", body: "Настройки можно изменить, удалив данные сайта в браузере. После этого сайт снова предложит выбрать допустимый режим использования cookie." },
      ],
    },
  },
  footer: {
    heading: "До встречи на площадке.",
    description: "Придумываем, комплектуем и проводим события, в которых людям действительно хочется участвовать.",
    locationDescription: "Выездные проекты обсуждаем отдельно: рассчитаем логистику и состав команды.",
  },
};

function cloneDefault(): LandingContentDraft {
  return structuredClone(defaultLandingContentDraft);
}

function isDraft(value: unknown): value is LandingContentDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LandingContentDraft>;
  return candidate.version === 3
    && Boolean(candidate.hero && candidate.formats && candidate.catalogGateway && candidate.cases)
    && Boolean(candidate.story && candidate.faq && candidate.leadForm && candidate.footer);
}

export function normalizeLandingContent(value: unknown): LandingContentDraft {
  if (!isDraft(value)) return cloneDefault();
  const candidate = value as LandingContentDraft & { legal?: LandingContentDraft["legal"] };
  const fallback = cloneDefault();
  return {
    ...candidate,
    legal: candidate.legal ?? fallback.legal,
  };
}

function migrateLegacyDraft(): LandingContentDraft | null {
  const stored = window.localStorage.getItem(PREVIOUS_STORAGE_KEY)
    ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!stored) return null;

  try {
    const legacy = JSON.parse(stored) as Partial<LandingContentDraft>;
    const migrated = cloneDefault();
    if (legacy.hero) migrated.hero = { ...migrated.hero, ...legacy.hero };
    if (legacy.trust) {
      migrated.trust.label = legacy.trust.label ?? migrated.trust.label;
      if (Array.isArray(legacy.trust.items)) {
        migrated.trust.items = legacy.trust.items.map((item) => typeof item === "string"
          ? { name: item, imagePath: "", href: "" }
          : item);
      }
    }
    if (legacy.contacts) migrated.contacts = { ...migrated.contacts, ...legacy.contacts } as LandingContentDraft["contacts"];
    if (legacy.footer) migrated.footer = { ...migrated.footer, ...legacy.footer };
    return migrated;
  } catch {
    return null;
  }
}

export function loadLocalDraft(): LandingContentDraft {
  if (typeof window === "undefined") return cloneDefault();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return migrateLegacyDraft() ?? cloneDefault();
    const parsed: unknown = JSON.parse(stored);
    return normalizeLandingContent(parsed);
  } catch {
    return cloneDefault();
  }
}

export function saveLocalDraft(draft: LandingContentDraft): LandingContentDraft {
  const saved = { ...draft, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

export function resetLocalDraft(): LandingContentDraft {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(PREVIOUS_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  return cloneDefault();
}

export function loadPreviewContent(): LandingContentDraft {
  if (typeof window === "undefined") return cloneDefault();
  const params = new URLSearchParams(window.location.search);
  return params.get("preview") === "local" ? loadLocalDraft() : cloneDefault();
}
