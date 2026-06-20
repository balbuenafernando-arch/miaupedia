import type { CatProfile, Reminder } from "@/lib/use-persistent-state";

export function calculateAge(birthDate:string, now=new Date()){
  if(!birthDate)return {years:0,months:0,label:"Fecha de nacimiento pendiente"};
  const birth=new Date(`${birthDate}T12:00:00`); if(Number.isNaN(birth.getTime())||birth>now)return {years:0,months:0,label:"Fecha no válida"};
  let months=(now.getFullYear()-birth.getFullYear())*12+now.getMonth()-birth.getMonth();
  if(now.getDate()<birth.getDate())months--; months=Math.max(0,months);
  const years=Math.floor(months/12),rest=months%12;
  const parts=[]; if(years)parts.push(`${years} año${years===1?"":"s"}`); if(rest||!years)parts.push(`${rest} mes${rest===1?"":"es"}`);
  return {years,months:rest,label:parts.join(" y ")};
}

export function missingProfileFields(cat:CatProfile){
  const missing:string[]=[]; if(!cat.photo)missing.push("Foto"); if(!cat.weight)missing.push("Peso"); if(!cat.weightDate)missing.push("Fecha del peso"); if(!cat.birthDate)missing.push("Fecha de nacimiento"); if(!cat.food.length&&!cat.litter.length&&!cat.toys.length)missing.push("Preferencias"); if(!cat.lifestyle)missing.push("Tipo de vida"); return missing;
}
export function profileCompletion(cat:CatProfile){const total=6;return Math.round(((total-missingProfileFields(cat).length)/total)*100)}

export function syncBirthdayReminder(cat:CatProfile, reminders:Reminder[]):Reminder[]{
  const others=reminders.filter(r=>!(r.catId===cat.id&&r.type==="Cumpleaños")); if(!cat.birthDate)return others;
  const birth=new Date(`${cat.birthDate}T12:00:00`),now=new Date(); let year=now.getFullYear(); let next=new Date(year,birth.getMonth(),birth.getDate()); if(next<new Date(now.getFullYear(),now.getMonth(),now.getDate()))year++;
  const birthday:Reminder={id:`birthday-${cat.id}`,catId:cat.id,type:"Cumpleaños",date:`${year}-${String(birth.getMonth()+1).padStart(2,"0")}-${String(birth.getDate()).padStart(2,"0")}`,description:`Cumpleaños de ${cat.name}`,completed:false};
  return [...others,birthday];
}
