import { FormEvent, type ReactNode, useState } from "react";
import { ArrowLeft, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "./AdminAuthContext";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const auth = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  if (auth.stage === "ready") return children;

  const submitLogin = (event: FormEvent) => {
    event.preventDefault();
    void auth.signIn(email.trim(), password);
  };

  const submitMfa = (event: FormEvent) => {
    event.preventDefault();
    void auth.verifyMfa(code);
  };

  return <main className="admin-authShell">
    <a className="admin-authBack" href="/"><ArrowLeft size={17} /> На сайт</a>
    <section className="admin-authPanel">
      <div className="admin-authBrand"><span>ВАУСТОРГ</span><small>Защищённая зона управления</small></div>

      {auth.stage === "loading" ? <div className="admin-authState"><LoaderCircle className="is-spinning" size={28} /><h1>Проверяем доступ</h1><p>Сессия и права администратора проверяются в Supabase.</p></div> : null}

      {auth.stage === "misconfigured" ? <div className="admin-authState"><LockKeyhole size={28} /><h1>Подключение не настроено</h1><p>Добавьте публичные переменные Supabase в окружение Vercel и перезапустите deployment.</p></div> : null}

      {auth.stage === "denied" ? <div className="admin-authState"><LockKeyhole size={28} /><h1>Нет доступа к проекту</h1><p>Учётная запись существует, но не добавлена в список администраторов WOWSTORG.</p><button type="button" onClick={() => void auth.signOut()}>Выйти</button></div> : null}

      {auth.stage === "signed_out" ? <form className="admin-authForm" onSubmit={submitLogin}>
        <div><KeyRound size={27} /><h1>Вход в админ-панель</h1><p>Используйте отдельную рабочую учётную запись. После пароля потребуется код из приложения-аутентификатора.</p></div>
        <label><span>Рабочая почта</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label><span>Пароль</span><input type="password" autoComplete="current-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {auth.error ? <p className="admin-formError" role="alert">{auth.error}</p> : null}
        <button type="submit">Продолжить</button>
      </form> : null}

      {auth.stage === "mfa" ? <form className="admin-authForm" onSubmit={submitMfa}>
        <div><ShieldCheck size={28} /><h1>{auth.qrCode ? "Подключите двухэтапную защиту" : "Подтвердите вход"}</h1><p>{auth.qrCode ? "Отсканируйте QR-код в приложении-аутентификаторе и введите шестизначный код." : "Введите актуальный код из приложения-аутентификатора."}</p></div>
        {auth.qrCode ? <img className="admin-authQr" src={auth.qrCode} alt="QR-код для подключения TOTP" /> : null}
        <label><span>Код подтверждения</span><input inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} /></label>
        {auth.error ? <p className="admin-formError" role="alert">{auth.error}</p> : null}
        <button type="submit" disabled={code.length !== 6}>Подтвердить</button>
        <button className="admin-authSecondary" type="button" onClick={() => void auth.signOut()}>Войти другой учётной записью</button>
      </form> : null}
    </section>
  </main>;
}
