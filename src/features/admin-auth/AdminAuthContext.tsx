import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, requireSupabase, supabase } from "@shared/api/supabase";

export type AdminProfile = {
  id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  is_active: boolean;
  display_name: string | null;
};

type AuthStage = "loading" | "signed_out" | "mfa" | "ready" | "denied" | "misconfigured";

type AdminAuthValue = {
  stage: AuthStage;
  session: Session | null;
  user: User | null;
  profile: AdminProfile | null;
  qrCode: string | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<AuthStage>(isSupabaseConfigured ? "loading" : "misconfigured");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolveSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setError(null);
    setQrCode(null);
    setFactorId(null);

    if (!nextSession) {
      setProfile(null);
      setStage("signed_out");
      return;
    }

    const client = requireSupabase();
    const { data: profileData, error: profileError } = await client
      .from("admin_profiles")
      .select("id, role, is_active, display_name")
      .eq("id", nextSession.user.id)
      .maybeSingle();

    if (profileError || !profileData?.is_active) {
      setProfile(null);
      setStage("denied");
      return;
    }
    setProfile(profileData as AdminProfile);

    const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (assurance.currentLevel === "aal2") {
      setStage("ready");
      return;
    }

    const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const verifiedFactor = factors.totp.find((factor) => factor.status === "verified");
    if (verifiedFactor) {
      setFactorId(verifiedFactor.id);
      setStage("mfa");
      return;
    }

    const { data: enrollment, error: enrollmentError } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "WOWSTORG Admin",
    });
    if (enrollmentError) throw enrollmentError;
    setFactorId(enrollment.id);
    setQrCode(enrollment.totp.qr_code);
    setStage("mfa");
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setStage("loading");
    const { data } = await supabase.auth.getSession();
    try {
      await resolveSession(data.session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось проверить сессию.");
      setStage(data.session ? "mfa" : "signed_out");
    }
  }, [resolveSession]);

  useEffect(() => {
    if (!supabase) return;
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") void resolveSession(null);
      if (event === "TOKEN_REFRESHED") setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh, resolveSession]);

  const value = useMemo<AdminAuthValue>(() => ({
    stage,
    session,
    user: session?.user ?? null,
    profile,
    qrCode,
    error,
    signIn: async (email, password) => {
      const client = requireSupabase();
      setError(null);
      setStage("loading");
      const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) {
        setStage("signed_out");
        setError("Не удалось войти. Проверьте почту и пароль.");
        return;
      }
      try {
        await resolveSession(data.session);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Не удалось подготовить защищённую сессию.");
        setStage("mfa");
      }
    },
    verifyMfa: async (code) => {
      if (!factorId) return;
      const client = requireSupabase();
      setError(null);
      const { error: verifyError } = await client.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
      if (verifyError) {
        setError("Код не подошёл. Дождитесь нового кода и попробуйте ещё раз.");
        return;
      }
      await refresh();
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      await resolveSession(null);
    },
    refresh,
  }), [error, factorId, profile, qrCode, refresh, resolveSession, session, stage]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
