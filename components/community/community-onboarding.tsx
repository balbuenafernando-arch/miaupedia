"use client";

import Image from "next/image";
import { MessageCircle, Search, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";


const steps = [
  ["Bienvenido a MIAUPEDIA","Descubre experiencias y recomendaciones compartidas por personas que también aman a sus gatos"],
  ["Encuentra una buena fija","Busca veterinarias, tiendas, precios y consejos que pueden ayudarte a cuidar mejor a tu gato"],
  ["Pasa la voz","Comparte tus experiencias, ayuda a otros y guarda las fijas que te sirvan"],
] as const;
const key="miaupedia:onboarding:bienvenida:1";
let finished=false;

export function CommunityOnboarding() {
  const [step,setStep]=useState<number|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const title=useRef<HTMLHeadingElement>(null);

  useEffect(()=>{
    try { if(!finished && localStorage.getItem(key)!=="1") setStep(0); }
    catch { if(!finished) setStep(0); }
  },[]);
  useEffect(()=>{
    if(step===null || !dialog.current) return;
    if(!dialog.current.open) dialog.current.showModal();
    title.current?.focus();
  },[step]);
  function dismiss() {
    finished=true;
    try { localStorage.setItem(key,"1"); } catch {}
    setStep(null);
  }

  if(step===null) return null;
  const [heading,text]=steps[step];
  return <dialog ref={dialog} className="community-dialog community-welcome" aria-labelledby="welcome-title"
    aria-describedby="welcome-copy" onCancel={event=>{event.preventDefault();dismiss();}}>
    <button type="button" className="community-link-button community-welcome-skip" onClick={dismiss}>Omitir</button>
    <div className={`community-welcome-art welcome-scene welcome-scene-${step}`} aria-hidden="true">
      {step===0 && <span className="welcome-phone"><Smartphone size={65}/></span>}
      <Image className="welcome-cat" src="/icons/gato-bienvenida.png" alt="" width={130} height={118} unoptimized/>
      {step===1 && <span className="welcome-prop"><Search size={32}/></span>}
      {step===2 && <>
        <span className="welcome-prop"><MessageCircle size={32}/></span>
        <Image className="welcome-cat welcome-cat-peer" src="/icons/gato-bienvenida.png" alt="" width={118} height={108} unoptimized/>
      </>}
    </div>
    <p className="community-welcome-step" aria-live="polite">Paso {step+1} de {steps.length}</p>
    <h2 id="welcome-title" ref={title} tabIndex={-1}>{heading}</h2>
    <p id="welcome-copy">{text}.</p>
    <div className="community-actions">
      {step>0 && <button className="community-secondary" onClick={()=>setStep(step-1)}>Anterior</button>}
      <button className="community-primary" onClick={step===2 ? dismiss : ()=>setStep(step+1)}>
        {step===2 ? "Empezar a explorar" : "Siguiente"}
      </button>
    </div>
  </dialog>;
}
