"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const client = createClient();
    if (!client) {
      setReady(false);
      return;
    }
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setReady(Boolean(session?.user));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createClient();
    if (!client || saving) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setSaving(true);
    setMessage("");
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        setMessage("No pudimos actualizar la contraseña. Revisa el enlace o solicita uno nuevo.");
        return;
      }
      setUpdated(true);
    } catch {
      setMessage("No pudimos conectar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="page content-width">
    <div className="page-title"><h1>Actualiza tu contraseña</h1></div>
    {updated ? <p role="status">Tu contraseña se actualizó.</p> : <>
      {ready === null && <p role="status">Verificando el enlace…</p>}
      {ready === false && <p>El enlace no está disponible. Solicita otro desde la pantalla de ingreso.</p>}
      {ready === true && <form className="stack-form" onSubmit={submit}>
        <label>Nueva contraseña
          <input type="password" name="password" minLength={8} autoComplete="new-password" required />
        </label>
        <button className="primary" disabled={saving}>Guardar contraseña</button>
      </form>}
      {message && <p role="alert">{message}</p>}
    </>}
    <Link href="/">Volver a Miaupedia</Link>
  </main>;
}
