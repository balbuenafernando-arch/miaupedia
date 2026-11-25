"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

const noticeKey = "miaupedia:aviso-fijas:v1";
let readThisSession = false;

export function CommunityNotice({children}: {children: ReactNode}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [read, setRead] = useState<boolean>();

  useEffect(() => {
    try { setRead(readThisSession || localStorage.getItem(noticeKey) === "1"); }
    catch { setRead(readThisSession); }
  }, []);

  useEffect(() => {
    if (read === false && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      heading.current?.focus();
    }
  }, [read]);

  if (read) return children;
  if (read === undefined) return null;

  return <dialog ref={dialog} className="community-dialog community-notice" aria-labelledby="fija-notice-title" aria-describedby="fija-notice-description"
    onCancel={event=>event.preventDefault()}>
    <h2 ref={heading} tabIndex={-1} id="fija-notice-title">Información de la comunidad</h2>
    <p id="fija-notice-description">Las fijas son publicaciones compartidas por usuarios de MIAUPEDIA. La plataforma no verifica ni garantiza la exactitud, vigencia o resultados de la información publicada. Recomendamos contrastar los datos antes de tomar decisiones, especialmente sobre la salud de tu mascota.</p>
    <button className="community-primary" onClick={()=>{
      readThisSession=true;
      try { localStorage.setItem(noticeKey,"1"); } catch {}
      setRead(true);
    }}>Entendido, ver fija</button>
    <Link className="community-link-button" href="/">Volver a Explorar</Link>
  </dialog>;
}
