"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MiaupediaLogo } from "@/components/miaupedia-logo";
import { googleSignInAvailable, startGoogleSignIn } from "@/lib/google-auth";

export function GoogleAccess({disabled=false}: {disabled?:boolean}) {
  const [availability, setAvailability] = useState<"checking" | "ready" | "unavailable">(disabled ? "checking" : "ready");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void googleSignInAvailable(controller.signal).then(available => {
      if (!controller.signal.aborted) setAvailability(available ? "ready" : "unavailable");
    }).catch(() => {
      if (!controller.signal.aborted) setAvailability("unavailable");
    });
    return () => controller.abort();
  }, []);

  return <div className="community-google-access">
    <button type="button" className="community-primary community-google" disabled={disabled || opening} onClick={async () => {
      setOpening(true);
      setError("");
      try {
        if (availability === "unavailable" && !await googleSignInAvailable(AbortSignal.timeout(8000))) {
          throw new Error("Google no está disponible en este momento.");
        }
        await startGoogleSignIn();
      } catch {
        setOpening(false);
        setError("No pudimos abrir el acceso con Google. Inténtalo de nuevo.");
      }
    }}>
      <span className="community-google-mark" aria-hidden="true">G</span>
      {opening ? "Abriendo Google…" : "Continuar con Google"}
    </button>
    {error && <p className="community-error" role="alert">{error}</p>}
  </div>;
}

export function CommunityAuthModal({onClose}: {onClose:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className="community-dialog community-auth" aria-labelledby="community-auth-title"
    onCancel={event => {event.preventDefault(); onClose();}} onClick={event => {
      if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }
    }}>
    <button type="button" className="community-icon" aria-label="Cerrar" onClick={onClose}><X size={20}/></button>
    <MiaupediaLogo/>
    <h2 id="community-auth-title">¡Únete a la comunidad!</h2>
    <p>Comparte tus fijas, pregunta y descubre recomendaciones de otros amantes de los gatos.</p>
    <GoogleAccess/>
  </dialog>;
}
