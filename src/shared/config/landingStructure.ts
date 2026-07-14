export type LandingSectionRole =
  | "attention"
  | "interest"
  | "trust"
  | "desire"
  | "selection"
  | "conversion"
  | "seo";

export type PlannedLandingSection = {
  id: string;
  title: string;
  role: LandingSectionRole;
  primaryQuestion: string;
  conversionJob: string;
  seoIntent?: string[];
};

export const plannedLandingSections: PlannedLandingSection[] = [
  {
    id: "hero",
    title: "Первый экран",
    role: "attention",
    primaryQuestion: "Кто такие ВАУСТОРГ и почему здесь хочется остаться?",
    conversionJob: "Сформировать премиальный вау-эффект и мягко направить к обсуждению проекта.",
    seoIntent: ["агентство мероприятий", "организация мероприятий", "тимбилдинг"],
  },
  {
    id: "positioning",
    title: "Позиционирование",
    role: "interest",
    primaryQuestion: "Чем агентство отличается от обычной аренды игр или ведущего?",
    conversionJob: "Показать, что ВАУСТОРГ собирает механику события, а не продаёт отдельный реквизит.",
  },
  {
    id: "formats",
    title: "Форматы мероприятий",
    role: "selection",
    primaryQuestion: "Подходит ли это под мой тип события?",
    conversionJob: "Развести корпоративы, тимбилдинги, промо-зоны, фестивали и выставки по понятным сценариям.",
    seoIntent: ["корпоративные мероприятия", "тимбилдинг для компании", "интерактивные зоны"],
  },
  {
    id: "catalog",
    title: "Каталог реквизита и услуг",
    role: "selection",
    primaryQuestion: "Что конкретно можно заказать или арендовать?",
    conversionJob: "Дать клиенту ощущение выбора и привести к заявке на подборку игр.",
    seoIntent: ["аренда реквизита для мероприятий", "игровой реквизит", "гигантские игры аренда"],
  },
  {
    id: "wow-mechanic",
    title: "Вау-механика",
    role: "desire",
    primaryQuestion: "Как это будет ощущаться на площадке?",
    conversionJob: "Перевести услугу из списка в живую сцену: гости подходят, играют, соревнуются, фотографируются.",
  },
  {
    id: "cases",
    title: "Кейсы и сценарии применения",
    role: "trust",
    primaryQuestion: "Есть ли похожая задача на мою?",
    conversionJob: "Снять риск через реальные или типовые сценарии без выдуманных клиентов.",
  },
  {
    id: "process",
    title: "Как проходит работа",
    role: "trust",
    primaryQuestion: "Насколько это управляемо и безопасно?",
    conversionJob: "Показать производство: бриф, механика, реквизит, площадка, проведение.",
  },
  {
    id: "faq",
    title: "Вопросы перед заявкой",
    role: "seo",
    primaryQuestion: "Какие вопросы мешают оставить заявку?",
    conversionJob: "Закрыть возражения по срокам, бюджету, площадке, количеству гостей и аренде.",
    seoIntent: ["сколько стоит тимбилдинг", "как организовать корпоратив", "аренда игр на мероприятие"],
  },
  {
    id: "cta",
    title: "Финальная заявка",
    role: "conversion",
    primaryQuestion: "Что сделать сейчас?",
    conversionJob: "Попросить описать задачу и пообещать подбор формата, а не абстрактную консультацию.",
  },
];
