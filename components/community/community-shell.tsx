"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Search, Send, UserRound, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CommunityAuthModal } from "./community-auth";
import type { User } from "@supabase/supabase-js";
import { MiaupediaLogo } from "@/components/miaupedia-logo";
import { useCatalogUser } from "@/components/recommendations/use-catalog-account";
import { acceptCommunityDocuments, checkCommunityAcceptance } from "@/lib/community";
import { legalDocuments, requiredDocuments } from "@/lib/community-legal";

const Access = createContext<{
  user: User | null | undefined;
  userId: string | null | undefined;
  requireAccount: (action: () => void) => void;
  requireParticipation: (action: () => void) => void;
} | null>(null);

export function useCommunityAccess() {
  const value = useContext(Access);
  if (!value) throw new Error("Falta el contexto de la comunidad.");
  return value;
}

const destinations = [
  {href:"/",label:"Explorar",Icon:Search},
  {href:"/pasar-la-voz",label:"Pasar la voz",Icon:Send},
  {href:"/guardados",label:"Guardados",Icon:Bookmark},
  {href:"/perfil",label:"Perfil",Icon:UserRound},
] as const;

export function CommunityShell({children}: {children:ReactNode}) {
  const pathname = usePathname();
  const user = useCatalogUser();
  const userId = user ? user.id : user;
  const [authOpen,setAuthOpen] = useState(false);
  const [consentFor,setConsentFor] = useState<{userId:string; next:() => void} | null>(null);
  const [error,setError] = useState("");

  useEffect(() => {
    if (!userId || pathname.startsWith("/politicas")) return;
    let active = true;
    void checkCommunityAcceptance().then(accepted => {
      if (active && !accepted) setConsentFor(current => current ?? {userId,next:() => undefined});
    }).catch(() => undefined);
    return () => { active = false; };
    // Onboarding opens once per account session, rather than on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[userId]);

  function requireAccount(action: () => void) {
    setError("");
    if (userId) action();
    else setAuthOpen(true);
  }

  function requireParticipation(action: () => void) {
    requireAccount(() => {
      if (!userId) return;
      void checkCommunityAcceptance().then(accepted => {
        if (accepted) action();
        else setConsentFor({userId,next:action});
      }).catch(() => setError("No pudimos verificar tu acceso a la comunidad. Inténtalo de nuevo."));
    });
  }

  return <Access.Provider value={{user,userId,requireAccount,requireParticipation}}>
    <div className="community-shell">
      <header className="community-header">
        <div className="community-wrap community-bar">
          <Link href="/" aria-label="MIAUPEDIA, inicio"><MiaupediaLogo /></Link>
          <nav aria-label="Navegación principal" className="community-nav">
            {destinations.map(({href,label,Icon}) => {
              const active = href === "/" ? pathname === "/" || pathname.startsWith("/fijas/") || pathname.startsWith("/sedes/") || pathname.startsWith("/autores/") : pathname.startsWith(href);
              return <Link key={href} href={href} aria-current={active ? "page" : undefined}>
                <span className="community-nav-icon"><Icon aria-hidden="true" size={20} /></span><span>{label}</span>
              </Link>;
            })}
          </nav>
        </div>
      </header>
      <main className="community-wrap community-main">
        {error && <p className="community-error" role="alert">{error}</p>}
        {children}
      </main>
      <footer className="community-wrap community-footer">
        {(Object.keys(legalDocuments) as (keyof typeof legalDocuments)[]).map(document =>
          <Link key={document} href={`/politicas/${document}`}>{legalDocuments[document].title}</Link>)}
      </footer>
      {authOpen && <CommunityAuthModal onClose={() => setAuthOpen(false)} />}
      {consentFor && consentFor.userId === userId && <Consent key={userId}
        onClose={() => setConsentFor(null)} onAccepted={() => {
          const next = consentFor.next;
          setConsentFor(null);
          next();
        }} />}
    </div>
  </Access.Provider>;
}

function Consent({onClose,onAccepted}: {onClose:()=>void;onAccepted:()=>void}) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  return <div className="community-overlay"><section className="community-dialog" role="dialog" aria-modal="true" aria-labelledby="community-consent-title">
    <button type="button" className="community-icon" aria-label="Cerrar" onClick={onClose}><X size={20}/></button>
    <h2 id="community-consent-title">Pasa una buena fija</h2>
    <p>Comparte lo que encontraste y dónde. Cuenta tu experiencia con respeto y sin compartir datos personales.</p>
    <form className="community-form" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setBusy(true); setError("");
      try {
        await acceptCommunityDocuments();
        onAccepted();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No pudimos guardar la aceptación.");
      } finally { setBusy(false); }
    }}>
      <ul>{requiredDocuments.map(document => <li key={document}>
        <a href={`/politicas/${document}`} target="_blank" rel="noopener">{legalDocuments[document].title} · {legalDocuments[document].version}</a>
      </li>)}</ul>
      <label className="community-check"><input type="checkbox" required /> Acepto los términos y las normas y he leído la política de privacidad.</label>
      {error && <p role="alert" className="community-error">{error}</p>}
      <button className="community-primary" disabled={busy}>Aceptar y continuar</button>
      <button type="button" className="community-link-button" onClick={onClose}>Seguir explorando</button>
    </form>
  </section></div>;
}
