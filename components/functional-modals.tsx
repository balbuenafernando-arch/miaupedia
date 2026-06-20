"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Cat, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { CatProfile } from "@/lib/use-persistent-state";

export type DemoUser = { id: string; name: string; email: string };

export function AuthModal({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: (user: DemoUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || email.split("@")[0]);
    const supabase = createClient();
    try {
      if (mode === "reset") {
        if (supabase) await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/actualizar-clave` });
        setMessage("Si la cuenta existe, recibirás un enlace para recuperar tu contraseña."); return;
      }
      if (supabase) {
        const result = mode === "signup"
          ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
          : await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (mode === "signup" && !result.data.session) { setMessage("Revisa tu correo para confirmar la cuenta."); return; }
        const user = result.data.user!;
        onAuthenticated({ id: user.id, name: user.user_metadata.display_name || name, email: user.email || email });
      } else {
        onAuthenticated({ id: crypto.randomUUID(), name, email });
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos completar la solicitud."); }
    finally { setLoading(false); }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="close" onClick={onClose} aria-label="Cerrar"><X/></button>
      <div className="auth-brand"><span><Cat/></span><h2>{mode === "signup" ? "Únete a Miaupedia" : mode === "reset" ? "Recupera tu acceso" : "Qué bueno verte"}</h2><p>{mode === "signup" ? "Crea tu cuenta y mejora las decisiones para tu gato." : mode === "reset" ? "Te enviaremos un enlace seguro a tu correo." : "Tus gatos, favoritos y recordatorios te esperan."}</p></div>
      <form onSubmit={submit} className="stack-form">
        {mode === "signup" && <label>Nombre <span><Cat size={17}/><input name="name" required autoComplete="name" placeholder="Tu nombre"/></span></label>}
        <label>Correo electrónico <span><Mail size={17}/><input name="email" required type="email" autoComplete="email" placeholder="tu@correo.com"/></span></label>
        {mode !== "reset" && <label>Contraseña <span><LockKeyhole size={17}/><input name="password" required minLength={8} type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo 8 caracteres"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="Mostrar contraseña">{showPassword?<EyeOff/>:<Eye/>}</button></span></label>}
        {mode === "login" && <button type="button" className="text-link" onClick={()=>setMode("reset")}>Olvidé mi contraseña</button>}
        {message && <p className="form-message">{message}</p>}
        <button className="primary full" disabled={loading}>{loading ? "Procesando…" : mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear mi cuenta" : "Enviar enlace"}</button>
      </form>
      <p className="auth-switch">{mode === "login" ? <>¿Primera vez? <button onClick={()=>setMode("signup")}>Crea una cuenta</button></> : <button onClick={()=>setMode("login")}><ArrowLeft size={14}/> Volver a iniciar sesión</button>}</p>
      {!createClient() && <span className="demo-mode"><ShieldCheck size={14}/> Modo demo local: los datos quedan en este navegador</span>}
    </div>
  </div>;
}

export function Onboarding({ onFinish, onSkip }: { onFinish: (cat: CatProfile | null, interests: number[]) => void; onSkip: () => void }) {
  const [step, setStep] = useState(1); const [cat, setCat] = useState<Partial<CatProfile>>({ sex:"Hembra", sterilized:true }); const [interests,setInterests]=useState<number[]>([]);
  const next = () => setStep(s=>Math.min(6,s+1)); const back=()=>setStep(s=>Math.max(1,s-1));
  const completeCat = cat.name ? { id:crypto.randomUUID(), name:cat.name, age:Number(cat.age||0), sex:cat.sex||"Hembra", breed:cat.breed||"Sin raza definida", sterilized:Boolean(cat.sterilized), birthDate:"", weight:0, food:cat.food||[], litter:cat.litter||[], toys:cat.toys||[] } as CatProfile : null;
  return <div className="onboarding"><div className="onboarding-card"><div className="onboarding-top"><div className="step-dots">{[1,2,3,4,5,6].map(n=><i key={n} className={n<=step?"active":""}/>)}</div><button onClick={onSkip}>Omitir</button></div>
    {step===1&&<div className="onboarding-copy"><span className="onboarding-art"><Cat/></span><span className="kicker">BIENVENIDO A MIAUPEDIA</span><h1>Decisiones más simples.<br/>Gatos más felices.</h1><p>Miaupedia te ayuda a descubrir productos, servicios y veterinarias mejor valoradas por otros dueños de gatos en Perú.</p></div>}
    {step===2&&<div><span className="kicker">PASO 2 DE 6</span><h2>Cuéntanos sobre tu gato</h2><p className="muted">Puedes completar más detalles después.</p><div className="form-grid"><label>Nombre<input value={cat.name||""} onChange={e=>setCat({...cat,name:e.target.value})} placeholder="Ej. Luna"/></label><label>Edad<input type="number" min="0" value={cat.age||""} onChange={e=>setCat({...cat,age:Number(e.target.value)})}/></label><label>Sexo<select value={cat.sex} onChange={e=>setCat({...cat,sex:e.target.value as CatProfile["sex"]})}><option>Hembra</option><option>Macho</option></select></label><label>Raza<input value={cat.breed||""} onChange={e=>setCat({...cat,breed:e.target.value})} placeholder="Ej. Mestizo"/></label><label className="check-label"><input type="checkbox" checked={cat.sterilized} onChange={e=>setCat({...cat,sterilized:e.target.checked})}/> Esterilizado</label></div></div>}
    {step===3&&<PreferenceStep cat={cat} setCat={setCat}/>} 
    {step===4&&<div><span className="kicker">PASO 4 DE 6</span><h2>Sigue lo que te interesa</h2><p className="muted">Así podremos avisarte cuando haya novedades.</p><div className="interest-grid">{[[1,"🏥","Clínica Felina Miraflores"],[2,"🛍️","Michimarket"],[4,"📦","Arena CleanCat Ultra"]].map(([id,icon,name])=><button key={id} className={interests.includes(Number(id))?"selected":""} onClick={()=>setInterests(v=>v.includes(Number(id))?v.filter(x=>x!==Number(id)):[...v,Number(id)])}><span>{icon}</span><b>{name}</b>{interests.includes(Number(id))&&<Check/>}</button>)}</div></div>}
    {step===5&&<div><span className="kicker">PASO 5 DE 6</span><h2>Todo en un solo lugar</h2><div className="benefit-list">{["Alertas de precios y nuevas reseñas","Favoritos y colecciones personales","Agenda de cuidados básicos","Experiencias de gatos similares"].map(x=><p key={x}><Check/> {x}</p>)}</div></div>}
    {step===6&&<div className="onboarding-copy"><span className="onboarding-art success"><Sparkles/></span><span className="kicker">¡TODO LISTO!</span><h1>Tu perfil está {completeCat?"80":"40"}% completo</h1><p>Ya puedes explorar recomendaciones de la comunidad felina peruana.</p><div className="profile-progress"><i style={{width:completeCat?"80%":"40%"}}/></div></div>}
    <div className="onboarding-actions">{step>1&&<button onClick={back}><ArrowLeft/> Atrás</button>}<button className="primary" disabled={step===2&&!cat.name} onClick={()=>step===6?onFinish(completeCat,interests):next()}>{step===6?"Explorar Miaupedia":"Continuar"}<ArrowRight/></button></div>
  </div></div>;
}

function PreferenceStep({cat,setCat}:{cat:Partial<CatProfile>;setCat:(cat:Partial<CatProfile>)=>void}){
  const groups:[keyof Pick<CatProfile,"food"|"litter"|"toys">,string,string[]][]=[["food","Alimentos",["Pollo","Salmón","Pavo"]],["litter","Arenas",["Aglutinante","Sin aroma","Biodegradable"]],["toys","Juguetes",["Varitas","Pelotas","Interactivos"]]];
  return <div><span className="kicker">PASO 3 DE 6 · OPCIONAL</span><h2>¿Qué cosas le gustan?</h2><p className="muted">Selecciona todas las que correspondan.</p>{groups.map(([key,label,options])=><div className="preference-pills" key={key}><b>{label}</b><div>{options.map(option=><button key={option} className={(cat[key]||[]).includes(option)?"selected":""} onClick={()=>{const old=cat[key]||[];setCat({...cat,[key]:old.includes(option)?old.filter(x=>x!==option):[...old,option]})}}>{option}</button>)}</div></div>)}</div>
}
