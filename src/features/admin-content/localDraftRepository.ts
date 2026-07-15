import type { LandingContentDraft } from "@entities/admin/model";

const STORAGE_KEY = "wowstorg:admin-content-draft:v3";
const PREVIOUS_STORAGE_KEY = "wowstorg:admin-content-draft:v2";
const LEGACY_STORAGE_KEY = "wowstorg:admin-content-draft:v1";

export const defaultLandingContentDraft: LandingContentDraft = {
  version: 3,
  updatedAt: "",
  seo: {
    title: "ВАУСТОРГ - ивент-агентство в Омске | Организация мероприятий",
    description: "ВАУСТОРГ - ивент-агентство в Омске. Организация мероприятий: корпоративы, тимбилдинги, игровые зоны, аренда реквизита и проведение под ключ.",
  },
  hero: {
    eyebrow: "Организация мероприятий · Омск",
    title: "События, которые",
    accent: "собирают людей.",
    description: "Корпоративы, тимбилдинги и игровые зоны в Омске. Разрабатываем механику, комплектуем площадку и проводим событие так, чтобы гости включались с первых минут.",
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
    summary: "Готовые программы, интерактивные зоны, аренда реквизита и события под ключ — под задачу, площадку и аудиторию.",
    catalogNote: "Изучите программы и реквизит в каталоге: сравните варианты, соберите подборку и прикрепите её к заявке.",
    catalogCtaLabel: "Открыть каталог",
    items: [
      { title: "Тимбилдинги", text: "Цельная командная программа с общей задачей, динамикой и финалом — вместо разрозненного набора конкурсов.", note: "" },
      { title: "Зоны встречи гостей", text: "Первый контакт с событием: помогает гостям освоиться, познакомиться и включиться ещё до основной программы.", note: "" },
      { title: "Игровые зоны", text: "Гибкий набор интерактивных станций и реквизита: от одной точки до полноценного пространства под площадку и аудиторию.", note: "" },
      { title: "События под ключ", text: "Берём на себя концепцию, сценарий, комплектацию, логистику, монтаж и проведение — вы работаете с одной командой.", note: "" },
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
      { id: "welcome", index: "02", tab: "Зоны встречи", title: "Зоны встречи гостей", subtitle: "Первое действие начинается раньше основной программы.", description: "Комплекты коротких механик для встречи гостей, свободного общения и мягкого включения в событие." },
      { id: "spaces", index: "03", tab: "Игровые зоны", title: "Игровые зоны", subtitle: "Несколько точек работают как единая среда.", description: "Зоны для корпоративов, фестивалей и выставок: гости свободно перемещаются, а команда держит ритм." },
      { id: "props", index: "04", tab: "Реквизит", title: "Реквизит", subtitle: "Когда сценарий уже есть, остаётся собрать точный состав.", description: "Оцифрованные позиции с описанием, фотографиями, комплектацией и доступностью на выбранные даты." },
    ],
  },
  cases: {
    eyebrow: "Портфолио",
    title: "Реализованные события.",
    description: "Выберите направление. Внутри — отдельные проекты с фотографиями, задачей, механикой и результатом.",
    collections: [
      { title: "Тимбилдинги", meta: "Реализованные командные программы", code: "КОМАНДА", projects: [] },
      { title: "Зоны встречи гостей", meta: "Проекты для встречи и вовлечения гостей", code: "ВСТРЕЧА", projects: [] },
      { title: "Игровые зоны", meta: "Игровые пространства на событиях", code: "ИГРА", projects: [] },
    ],
  },
  story: {
    label: "Как создаём событие",
    scenes: [
      { title: "Начинаем с задачи.", text: "Вы рассказываете, кого приглашаете, какой формат планируете и какого результата ждёте. Этого достаточно, чтобы начать — подробное техническое задание не требуется.", aside: "Первый разговор — о задаче, аудитории и площадке.", align: "left", action: null },
      { title: "Проектируем путь гостя.", text: "Определяем логику события: как гости знакомятся с форматом, включаются в действие и приходят к общей кульминации. Учитываем тайминг, пространство и особенности аудитории.", aside: "У каждой механики есть функция, а не просто место в программе.", align: "right", action: null },
      { title: "Собираем решение.", text: "Подбираем программу, станции, реквизит, ведущих и брендирование. Берём готовое решение за основу или адаптируем его под вашу задачу.", aside: "Состав проекта можно изучить заранее в цифровом каталоге.", align: "left", action: { label: "Открыть каталог", href: "/catalog" } },
      { title: "Готовим и проводим.", text: "Готовим реквизит и команду, доставляем и монтируем оборудование, проводим программу и контролируем тайминг на площадке.", aside: "Одна команда отвечает за подготовку, логистику и проведение.", align: "right", action: null },
      { title: "Завершаем общим финалом.", text: "Событие заканчивается общей точкой, к которой участники пришли вместе. После брифа вы получаете понятный формат, состав проекта и план подготовки.", aside: "", align: "right", action: { label: "Обсудить событие", href: "#brief" } },
    ],
  },
  faq: {
    title: "Частые вопросы",
    items: [
      { question: "Можно прийти без готового сценария и ТЗ?", answer: "Да. Расскажите, кого приглашаете, что должно происходить на площадке и какого результата вы ждёте. Мы предложим подходящий формат, состав проекта и следующие шаги." },
      { question: "Можно арендовать только реквизит?", answer: "Да. Вы можете выбрать отдельные позиции в каталоге, забрать их самостоятельно и вернуть после события. При необходимости организуем доставку, монтаж, демонтаж и работу нашей команды на площадке." },
      { question: "Можно собрать решение под конкретный бюджет?", answer: "Да. Масштаб проекта может начинаться с одной позиции и доходить до полной организации события. Подберём состав без лишних элементов и заранее покажем, из чего складывается стоимость." },
      { question: "Что входит в организацию под ключ?", answer: "Концепция, сценарий, подбор и подготовка реквизита, команда, логистика, монтаж, проведение и демонтаж. Состав можно расширять или сокращать под задачу конкретного события." },
      { question: "Вы работаете за пределами Омска?", answer: "Да, проводим выездные проекты. География не ограничена: отдельно рассчитываем логистику, состав оборудования и команды для выбранного города." },
    ],
  },
  leadForm: {
    eyebrow: "Заявка на мероприятие",
    title: "Обсудить мероприятие.",
    description: "Три факта о задаче и контакт. Вернёмся с подходящим форматом, а не общей презентацией.",
    eventTypes: ["Тимбилдинг", "Корпоратив", "Зона встречи гостей", "Выставка / промо", "Аренда реквизита", "Нужна идея"],
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

function replaceLegacy(value: string, legacy: string, replacement: string) {
  return value === legacy ? replacement : value;
}

function replaceLegacyVariants(value: string, legacyVariants: string[], replacement: string) {
  return legacyVariants.includes(value) ? replacement : value;
}

function migratePublicWording(draft: LandingContentDraft): LandingContentDraft {
  const migrated = structuredClone(draft);

  migrated.seo.title = replaceLegacyVariants(
    migrated.seo.title,
    [
      "ВАУСТОРГ — event-агентство и тимбилдинги в Омске",
      "Event-агентство ВАУСТОРГ в Омске — тимбилдинги и мероприятия",
      "Организация мероприятий в Омске - ВАУСТОРГ",
      "ВАУСТОРГ - ивент-агентство и организация мероприятий в Омске",
    ],
    "ВАУСТОРГ - ивент-агентство в Омске | Организация мероприятий",
  );
  migrated.seo.description = replaceLegacyVariants(
    migrated.seo.description,
    [
      "Корпоративы, тимбилдинги, welcome-зоны и игровой реквизит в Омске. Разрабатываем механику, комплектуем площадку и проводим событие под ключ.",
      "Организация мероприятий в Омске: корпоративы, тимбилдинги, зоны встречи гостей, игровые станции и аренда реквизита. Сценарий и проведение.",
    ],
    "ВАУСТОРГ - ивент-агентство в Омске. Организация мероприятий: корпоративы, тимбилдинги, игровые зоны, аренда реквизита и проведение под ключ.",
  );
  migrated.hero.eyebrow = replaceLegacy(
    migrated.hero.eyebrow,
    "Event-агентство · Омск",
    "Организация мероприятий · Омск",
  );

  migrated.formats.items = migrated.formats.items.map((item) => ({
    ...item,
    title: replaceLegacy(item.title, "Welcome-зоны", "Зоны встречи гостей"),
  }));
  migrated.catalogGateway.sections = migrated.catalogGateway.sections.map((section) => section.id === "welcome"
    ? {
      ...section,
      tab: replaceLegacy(section.tab, "Welcome", "Зоны встречи"),
      title: replaceLegacy(section.title, "Welcome-зоны", "Зоны встречи гостей"),
    }
    : section);
  migrated.cases.collections = migrated.cases.collections.map((collection) => ({
    ...collection,
    title: replaceLegacy(collection.title, "Welcome-зоны", "Зоны встречи гостей"),
    code: collection.code === "TEAM"
      ? "КОМАНДА"
      : collection.code === "WELCOME"
        ? "ВСТРЕЧА"
        : collection.code === "PLAY"
          ? "ИГРА"
          : collection.code,
  }));
  migrated.leadForm.eventTypes = migrated.leadForm.eventTypes.map((eventType) => replaceLegacy(
    eventType,
    "Welcome-зона",
    "Зона встречи гостей",
  ));

  return migrated;
}

export function normalizeLandingContent(value: unknown): LandingContentDraft {
  if (!isDraft(value)) return cloneDefault();
  const candidate = value as LandingContentDraft & { legal?: LandingContentDraft["legal"] };
  const fallback = cloneDefault();
  return migratePublicWording({
    ...candidate,
    legal: candidate.legal ?? fallback.legal,
  });
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
