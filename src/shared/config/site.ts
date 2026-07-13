export const siteConfig = {
  brandName: "ВАУСТОРГ",
  contactEmail: "wowstorg@mail.ru",
  contactPhones: [
    { label: "+7 950 784-31-92", href: "tel:+79507843192" },
    { label: "+7 983 404-10-73", href: "tel:+79834041073" },
  ],
  city: "Омск",
  heroVideoPath: "/hero.mp4",
} as const;

export const navigationItems = [
  { label: "Форматы", href: "#formats" },
  { label: "Каталог", href: "#catalog" },
  { label: "Кейсы", href: "#cases" },
  { label: "Как работаем", href: "#story" },
  { label: "Вопросы", href: "#faq" },
] as const;
