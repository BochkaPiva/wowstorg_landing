import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { useCatalogCart } from "@features/catalog-cart/CatalogCartContext";
import { useSiteContent } from "@features/site-content/SiteContentContext";
import { TurnstileWidget } from "@shared/ui/TurnstileWidget";
import { LegalLink } from "@widgets/legal/LegalModal";

type LeadFormState = {
  eventType: string;
  guestRange: string;
  dateMode: "exact" | "period" | "unknown";
  exactDate: string;
  periodMonth: string;
  periodPart: "any" | "start" | "middle" | "end";
  name: string;
  company: string;
  contactType: string;
  contact: string;
  message: string;
  consent: boolean;
};

const initialState: LeadFormState = {
  eventType: "",
  guestRange: "",
  dateMode: "unknown",
  exactDate: "",
  periodMonth: "",
  periodPart: "any",
  name: "",
  company: "",
  contactType: "Телефон",
  contact: "",
  message: "",
  consent: false,
};

const consentVersion = "2026-07-13-v1";

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const periodPartLabels = {
  any: "Весь месяц",
  start: "Начало",
  middle: "Середина",
  end: "Конец",
} as const;

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatExactDate(value: string) {
  if (!value) return "Выберите день";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(parseIsoDate(value));
}

function formatPeriodMonth(value: string) {
  if (!value) return "Выберите месяц";
  const [year, month] = value.split("-").map(Number);
  return `${monthNames[month - 1]} ${year}`;
}

function getCalendarDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= totalDays ? new Date(year, month, day) : null;
  });
}

function formatRussianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  let normalized = digits;
  if (normalized.startsWith("8")) {
    normalized = `7${normalized.slice(1)}`;
  } else if (!normalized.startsWith("7")) {
    normalized = `7${normalized}`;
  }

  const local = normalized.slice(1, 11);
  let formatted = "+7";
  if (local.length > 0) formatted += ` (${local.slice(0, 3)}`;
  if (local.length >= 3) formatted += ")";
  if (local.length > 3) formatted += ` ${local.slice(3, 6)}`;
  if (local.length > 6) formatted += `-${local.slice(6, 8)}`;
  if (local.length > 8) formatted += `-${local.slice(8, 10)}`;
  return formatted;
}

function ChoiceGroup({ name, options, value, onChange }: {
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="brief-choiceGroup">
      {options.map((option) => (
        <label key={option} className={value === option ? "is-selected" : ""}>
          <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
          <span>{option}</span>
          <Check size={15} aria-hidden="true" />
        </label>
      ))}
    </div>
  );
}

export function LeadForm() {
  const { content: previewContent } = useSiteContent();
  const eventTypes = previewContent.leadForm.eventTypes;
  const guestRanges = previewContent.leadForm.guestRanges;
  const contactTypes = previewContent.leadForm.contactTypes;
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<LeadFormState>(initialState);
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeKey, setChallengeKey] = useState(0);
  const { items: cartItems, totalQuantity, clearCart } = useCatalogCart();
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
  const isPhoneContact = form.contactType === "Телефон";

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const calendarDays = useMemo(() => getCalendarDays(calendarCursor), [calendarCursor]);
  const periodMonths = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() + index, 1);
    return { value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: monthNames[date.getMonth()], year: date.getFullYear() };
  }), [today]);
  const dateComplete = form.dateMode === "unknown" || (form.dateMode === "exact" ? Boolean(form.exactDate) : Boolean(form.periodMonth));
  const firstStepComplete = Boolean(form.eventType && form.guestRange && dateComplete);
  const contactPlaceholder = useMemo(() => {
    if (form.contactType === "Email") return "name@company.ru";
    if (form.contactType === "MAX") return "Телефон или ссылка на профиль";
    return "+7 900 000-00-00";
  }, [form.contactType]);
  const contactHint = useMemo(() => {
    if (form.contactType === "Email") return "Пришлём предложение и уточняющие вопросы на почту.";
    if (form.contactType === "MAX") return "Напишем в MAX по номеру или ссылке на профиль.";
    return "Позвоним или напишем — как будет удобнее.";
  }, [form.contactType]);
  const dateSummary = useMemo(() => {
    if (form.dateMode === "exact") return formatExactDate(form.exactDate);
    if (form.dateMode === "period") {
      if (!form.periodMonth) return "примерный период";
      const part = form.periodPart === "any" ? "" : ` · ${periodPartLabels[form.periodPart].toLocaleLowerCase("ru-RU")}`;
      return `${formatPeriodMonth(form.periodMonth)}${part}`;
    }
    return "дата уточняется";
  }, [form.dateMode, form.exactDate, form.periodMonth, form.periodPart]);
  const update = <Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileError = useCallback((code?: string) => {
    setSubmissionStatus("error");
    setSubmissionMessage(code === "110200"
      ? "Защита формы ещё не активирована для этого адреса. Пожалуйста, свяжитесь с нами напрямую."
      : "Не удалось загрузить защиту формы. Обновите страницу или свяжитесь с нами напрямую.");
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.consent) return;
    if (!supabaseUrl || !publishableKey || !turnstileSiteKey) {
      setSubmissionStatus("error");
      setSubmissionMessage("Форма ещё не подключена к серверу. Используйте телефон или почту слева.");
      return;
    }
    if (!turnstileToken) {
      setSubmissionStatus("error");
      setSubmissionMessage("Подождите секунду: завершается проверка безопасности.");
      return;
    }

    setSubmissionStatus("submitting");
    setSubmissionMessage("");

    const eventDate = form.dateMode === "exact" ? form.exactDate : null;
    const dateNote = form.dateMode === "period" && form.periodMonth
      ? `Ориентир по дате: ${dateSummary}.`
      : "";
    const message = [dateNote, form.message.trim()].filter(Boolean).join("\n");

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publishableKey,
        },
        body: JSON.stringify({
          eventType: form.eventType,
          guestRange: form.guestRange,
          dateMode: form.dateMode === "exact" ? "known" : "flexible",
          eventDate,
          name: form.name,
          company: form.company,
          contactType: form.contactType,
          contact: form.contact,
          message,
          catalogSelection: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
          catalogSelectionIds: cartItems.flatMap((item) => Array.from({ length: item.quantity }, () => item.id)),
          consentVersion,
          turnstileToken,
        }),
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        if (response.status === 429) throw new Error("Слишком много попыток. Подождите несколько минут и попробуйте снова.");
        if (result?.error === "verification_failed") throw new Error("Проверка безопасности устарела. Попробуйте отправить ещё раз.");
        throw new Error("Заявка не отправилась. Попробуйте ещё раз или свяжитесь с нами напрямую.");
      }

      setSubmissionStatus("success");
      setSubmissionMessage("Заявка принята. Мы свяжемся с вами, чтобы уточнить детали события.");
      clearCart();
    } catch (error) {
      setSubmissionStatus("error");
      setSubmissionMessage(error instanceof Error && error.name !== "TimeoutError"
        ? error.message
        : "Сервер отвечает слишком долго. Попробуйте ещё раз или свяжитесь с нами напрямую.");
      setTurnstileToken("");
      setChallengeKey((current) => current + 1);
    }
  };

  return (
    <section className="brief-section" id="brief">
      <span id="contacts" className="brief-section__anchor" aria-hidden="true" />
      <div className="brief-section__inner">
        <header className="brief-section__header">
          <p>{previewContent.leadForm.eyebrow}</p>
          <h2>{previewContent.leadForm.title}</h2>
          <span>{previewContent.leadForm.description}</span>
          <div className="brief-section__direct">
            <a href={`tel:${previewContent.contacts.phones[0].replace(/[^\d+]/g, "")}`}>{previewContent.contacts.phones[0]}</a>
            <a href={`mailto:${previewContent.contacts.email}`}>{previewContent.contacts.email}</a>
          </div>
        </header>

        <form className="brief-form" onSubmit={submit} aria-busy={submissionStatus === "submitting"}>
          {submissionStatus === "success" ? (
            <div className="brief-success" role="status">
              <Check size={28} aria-hidden="true" />
              <strong>Спасибо, всё получили.</strong>
              <p>{submissionMessage}</p>
              <button type="button" onClick={() => { setForm(initialState); setStep(1); setSubmissionStatus("idle"); setSubmissionMessage(""); setTurnstileToken(""); setChallengeKey((current) => current + 1); }}>Отправить ещё одну заявку</button>
            </div>
          ) : <>
          {cartItems.length ? (
            <div className="brief-cartSummary">
              <ShoppingBag size={20} aria-hidden="true" />
              <div><strong>К заявке прикреплена подборка</strong><span>{totalQuantity} поз. из каталога</span></div>
              <a href="/catalog">Изменить</a>
            </div>
          ) : null}
          <div className="brief-form__progress" aria-label={`Шаг ${step} из 2`}>
            <span className={step >= 1 ? "is-active" : ""}>01 Событие</span>
            <span className={step >= 2 ? "is-active" : ""}>02 Контакт</span>
          </div>

          {step === 1 ? (
            <div className="brief-form__step">
              <fieldset>
                <legend>Что планируете?</legend>
                <ChoiceGroup name="eventType" options={eventTypes} value={form.eventType} onChange={(value) => update("eventType", value)} />
              </fieldset>

              <fieldset>
                <legend>Сколько будет гостей?</legend>
                <ChoiceGroup name="guestRange" options={guestRanges} value={form.guestRange} onChange={(value) => update("guestRange", value)} />
              </fieldset>

              <fieldset className="brief-date">
                <legend>Когда планируете?</legend>
                <div className="brief-date__mode" role="group" aria-label="Насколько определена дата">
                  <button type="button" className={form.dateMode === "exact" ? "is-selected" : ""} onClick={() => update("dateMode", "exact")}><CalendarDays size={16} />Точная дата</button>
                  <button type="button" className={form.dateMode === "period" ? "is-selected" : ""} onClick={() => update("dateMode", "period")}>Примерный период</button>
                  <button type="button" className={form.dateMode === "unknown" ? "is-selected" : ""} onClick={() => update("dateMode", "unknown")}>Пока не знаю</button>
                </div>

                {form.dateMode === "exact" ? (
                  <div className="brief-date__panel brief-date__panel--calendar">
                    <div className="brief-date__selection">
                      <span>Дата события</span>
                      <strong>{formatExactDate(form.exactDate)}</strong>
                      <p>Можно изменить позже — сейчас нужен ориентир для подготовки.</p>
                    </div>
                    <div className="brief-calendar">
                      <div className="brief-calendar__head">
                        <button type="button" aria-label="Предыдущий месяц" disabled={calendarCursor <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
                        <strong>{monthNames[calendarCursor.getMonth()]} {calendarCursor.getFullYear()}</strong>
                        <button type="button" aria-label="Следующий месяц" onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
                      </div>
                      <div className="brief-calendar__week" aria-hidden="true">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
                      <div className="brief-calendar__days">
                        {calendarDays.map((date, index) => date ? (
                          <button
                            type="button"
                            key={toIsoDate(date)}
                            disabled={date < today}
                            className={form.exactDate === toIsoDate(date) ? "is-selected" : ""}
                            aria-label={new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(date)}
                            onClick={() => update("exactDate", toIsoDate(date))}
                          >{date.getDate()}</button>
                        ) : <span key={`empty-${index}`} />)}
                      </div>
                    </div>
                  </div>
                ) : null}

                {form.dateMode === "period" ? (
                  <div className="brief-date__panel brief-date__panel--period">
                    <div className="brief-period__head">
                      <span>Выберите ближайший ориентир</span>
                      <strong>{form.periodMonth ? dateSummary : "Даже примерного месяца достаточно"}</strong>
                    </div>
                    <div className="brief-period__months" role="group" aria-label="Примерный месяц события">
                      {periodMonths.map((month, index) => (
                        <button type="button" key={month.value} className={form.periodMonth === month.value ? "is-selected" : ""} onClick={() => update("periodMonth", month.value)}>
                          <span>{month.label}</span>{index === 0 || month.year !== periodMonths[index - 1]?.year ? <small>{month.year}</small> : null}
                        </button>
                      ))}
                    </div>
                    {form.periodMonth ? (
                      <div className="brief-period__parts" role="group" aria-label="Часть месяца">
                        <span>Насколько точно?</span>
                        <div>{(Object.keys(periodPartLabels) as Array<keyof typeof periodPartLabels>).map((part) => <button type="button" key={part} className={form.periodPart === part ? "is-selected" : ""} onClick={() => update("periodPart", part)}>{periodPartLabels[part]}</button>)}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {form.dateMode === "unknown" ? <p className="brief-date__unknown">Это нормально. Вернёмся к календарю после короткого разговора.</p> : null}
              </fieldset>

              <button className="brief-form__next" type="button" disabled={!firstStepComplete} onClick={() => setStep(2)}>
                Оставить контакт <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="brief-form__step">
              <div className="brief-fields">
                <label><span>Ваше имя</span><input type="text" autoComplete="name" value={form.name} required placeholder="Как к вам обращаться" onChange={(event) => update("name", event.target.value)} /></label>
                <label><span>Компания</span><input type="text" autoComplete="organization" value={form.company} placeholder="Необязательно" onChange={(event) => update("company", event.target.value)} /></label>
              </div>

              <fieldset>
                <legend>Куда удобнее ответить?</legend>
                <ChoiceGroup
                  name="contactType"
                  options={contactTypes}
                  value={form.contactType}
                  onChange={(value) => {
                    update("contactType", value);
                    if (value === "Телефон") update("contact", formatRussianPhone(form.contact));
                  }}
                />
                <div className="brief-contactField" key={form.contactType}>
                  <input
                    className="brief-contactInput"
                    type={form.contactType === "Email" ? "email" : "text"}
                    inputMode={isPhoneContact ? "tel" : undefined}
                    autoComplete={isPhoneContact ? "tel" : form.contactType === "Email" ? "email" : "off"}
                    value={form.contact}
                    required
                    maxLength={isPhoneContact ? 18 : undefined}
                    pattern={isPhoneContact ? "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}" : undefined}
                    title={isPhoneContact ? "Введите номер полностью: +7 (900) 000-00-00" : undefined}
                    placeholder={contactPlaceholder}
                    aria-label={`Контакт: ${form.contactType}`}
                    onChange={(event) => update("contact", isPhoneContact ? formatRussianPhone(event.target.value) : event.target.value)}
                  />
                  <span className="brief-contactHint">{contactHint}</span>
                </div>
              </fieldset>

              <label className="brief-message"><span>Что ещё важно учесть?</span><textarea value={form.message} rows={2} placeholder="Площадка, задача или ориентир по бюджету — необязательно" onChange={(event) => update("message", event.target.value)} /></label>

              <label className={`brief-check brief-check--consent${form.consent ? " is-checked" : ""}`}>
                <input type="checkbox" checked={form.consent} required onChange={(event) => update("consent", event.target.checked)} />
                <span className="brief-check__box"><Check size={14} /></span>
                <span>Даю <LegalLink document="personalData">согласие на обработку персональных данных</LegalLink> и принимаю <LegalLink document="privacy">политику конфиденциальности</LegalLink>.</span>
              </label>

              {turnstileSiteKey ? <TurnstileWidget key={challengeKey} siteKey={turnstileSiteKey} onToken={handleTurnstileToken} onError={handleTurnstileError} /> : null}

              <div className="brief-form__actions">
                <button type="button" className="brief-form__back" onClick={() => setStep(1)}><ArrowLeft size={18} /> Назад</button>
                <button className="brief-form__submit" type="submit" disabled={submissionStatus === "submitting" || Boolean(turnstileSiteKey && !turnstileToken)}>{submissionStatus === "submitting" ? "Отправляем…" : "Отправить"} <ArrowRight size={18} /></button>
              </div>
              {submissionMessage ? <p className={`brief-form__delivery is-${submissionStatus}`} role="status">{submissionMessage}</p> : null}
            </div>
          )}
          </>}
        </form>
      </div>
    </section>
  );
}
