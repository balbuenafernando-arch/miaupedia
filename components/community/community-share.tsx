"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function CommunityShare({path,title,invite=false}: {path:string;title:string;invite?:boolean}) {
  const [message,setMessage]=useState("");
  const [manual,setManual]=useState("");
  return <div className="community-share">
    <button type="button" className="community-secondary" onClick={async()=>{
      const url=new URL(path,"https://miaupedia.vercel.app").href;
      setMessage("");setManual("");
      if (navigator.share) {
        try {
          await navigator.share({title,url,...(invite?{text:"Descubre y comparte buenas fijas para cuidar a tu gato."}:{})});
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name==="AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Enlace copiado.");
      } catch { setManual(url); }
    }}><Share2 size={16} aria-hidden="true"/>{invite?"Invita a alguien a MIAUPEDIA":"Compartir"}</button>
    {message && <span role="status">{message}</span>}
    {manual && <label>Enlace para copiar<input readOnly value={manual} onFocus={event=>event.currentTarget.select()}/></label>}
  </div>;
}
