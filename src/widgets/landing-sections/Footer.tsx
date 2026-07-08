const links = [
  ["Форматы", "#formats"],
  ["Игры", "#games"],
  ["Кейсы", "#cases"],
  ["Аренда", "#formats"],
  ["Контакты", "#contacts"],
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="section-inner footer__inner">
        <div>
          <strong>ВАУСТОРГ</strong>
          <p>Корпоративы • Тимбилдинги • Интерактивы • Аренда реквизита</p>
        </div>
        <nav aria-label="Нижняя навигация">
          {links.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <small>© 2026 ВАУСТОРГ. Все права защищены.</small>
      </div>
    </footer>
  );
}
