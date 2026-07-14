import { useEffect, useState } from "react";
import { LegalLink } from "./LegalModal";

const STORAGE_KEY = "wowstorg-cookie-choice";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const choose = (choice: "all" | "necessary") => {
    window.localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-consent" aria-label="Настройки cookie">
      <div>
        <strong>Ваш выбор, без мелкого шрифта.</strong>
        <p>Необходимые технологии помогают сайту работать. Аналитические cookie включим только с вашего согласия. <LegalLink document="cookies">Подробнее</LegalLink></p>
      </div>
      <div className="cookie-consent__actions">
        <button type="button" onClick={() => choose("necessary")}>Только необходимые</button>
        <button type="button" onClick={() => choose("all")}>Разрешить аналитику</button>
      </div>
    </aside>
  );
}
