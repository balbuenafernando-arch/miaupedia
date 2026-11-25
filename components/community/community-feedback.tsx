"use client";

import { MessageSquarePlus, X } from "lucide-react";
import { useRef,useState,type FormEvent } from "react";
import { createClient } from "@/lib/supabase";

const categories = {
  sugerencia:"Tengo una sugerencia",
  problema:"Encontré un problema",
  comentario:"Quiero comentar algo",
} as const;

function feedbackDevice() {
  const key="miaupedia:feedback-device";
  try {
    const existing=localStorage.getItem(key);
    if (existing && /^[a-f0-9-]{36}$/i.test(existing)) return existing;
    const value=crypto.randomUUID();
    localStorage.setItem(key,value);
    return value;
  } catch { return crypto.randomUUID(); }
}

export function CommunityFeedback() {
  const dialog=useRef<HTMLDialogElement>(null);
  const request=useRef<{id:string;payload:string}|null>(null);
  const device=useRef<string>(null);
  const running=useRef(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [sent,setSent]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (running.current) return;
    const form=event.currentTarget;
    const values=new FormData(form);
    const category=String(values.get("category"));
    const content=String(values.get("content")).trim();
    if (values.get("website")) return;
    if (!Object.hasOwn(categories,category) || content.length<10 || content.length>1000) {
      setError("Elige una categoría y escribe entre 10 y 1000 caracteres.");
      return;
    }
    running.current=true;
    setBusy(true);setError("");
    const payload=JSON.stringify([category,content]);
    if (request.current?.payload!==payload) request.current={id:crypto.randomUUID(),payload};
    device.current ??= feedbackDevice();
    try {
      const client=createClient();
      if (!client) throw new Error();
      const result=await client.rpc("submit_community_feedback",{
        request_id:request.current.id,category,content,device_id:device.current,
      });
      if (result.error?.message==="feedback_rate_limit") {
        setError("Has enviado varios comentarios. Inténtalo más tarde.");
        return;
      }
      if (result.error) throw result.error;
      form.reset();
      setSent(true);
    } catch { setError("No pudimos enviar tu comentario. Inténtalo de nuevo."); }
    finally { running.current=false;setBusy(false); }
  }

  return <>
    <button type="button" className="community-secondary" onClick={()=>{
      setSent(false);setError("");dialog.current?.showModal();
    }}><MessageSquarePlus size={17} aria-hidden="true"/> Ayúdanos a mejorar</button>
    <dialog ref={dialog} className="community-dialog community-feedback" aria-labelledby="feedback-title">
      <button type="button" className="community-icon" aria-label="Cerrar" onClick={()=>dialog.current?.close()}><X size={20}/></button>
      <h2 id="feedback-title">Ayúdanos a mejorar</h2>
      {sent ? <p role="status">Gracias. Recibimos tu comentario.</p> : <form className="community-form" onSubmit={submit}>
        <label>Categoría<select name="category" defaultValue="" required>
          <option disabled value="">Selecciona una opción</option>
          {Object.entries(categories).map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select></label>
        <label>Tu comentario<textarea name="content" rows={4} minLength={10} maxLength={1000} required/></label>
        <input name="website" hidden tabIndex={-1} autoComplete="off"/>
        {error && <p className="community-error" role="alert">{error}</p>}
        <button type="submit" className="community-primary" disabled={busy}>{busy?"Enviando…":"Enviar comentario"}</button>
      </form>}
    </dialog>
  </>;
}
