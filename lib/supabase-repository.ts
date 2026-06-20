import { createClient } from "@/lib/supabase";
import type { CatProfile, Reminder, UserReview } from "@/lib/use-persistent-state";
import type { FollowSignal } from "@/lib/recommendations";

export async function loadPrivateData(userId: string) {
  const db = createClient(); if (!db) return null;
  const [{data:catRows,error:catError},{data:followRows},{data:reviewRows}] = await Promise.all([
    db.from("cats").select("*,cat_preferences(*)").eq("user_id",userId).order("created_at"),
    db.from("demo_follows").select("listing_id").eq("user_id",userId),
    db.from("reviews").select("*").eq("user_id",userId).order("created_at",{ascending:false})
  ]);
  if (catError) throw catError;
  const cats:CatProfile[]=(catRows||[]).map(row=>({id:row.id,name:row.nombre,sex:row.sexo,breed:row.raza||"Sin raza definida",sterilized:row.esterilizado,birthDate:row.fecha_nacimiento||"",weight:Number(row.peso||0),weightDate:row.fecha_peso||"",photo:row.foto||"",lifestyle:row.tipo_vida||"Interior",personality:row.personalidad||"",regularVet:row.veterinaria_habitual||"",ownerNotes:row.observaciones_dueno||"",food:row.cat_preferences?.[0]?.alimentos||[],litter:row.cat_preferences?.[0]?.arenas||[],toys:row.cat_preferences?.[0]?.juguetes||[]}));
  const reminders:Reminder[]=[];
  if(cats.length){const {data}=await db.from("reminders").select("*").in("cat_id",cats.map(c=>c.id));(data||[]).forEach(r=>reminders.push({id:r.id,catId:r.cat_id,type:r.tipo,date:r.fecha,description:r.descripcion,completed:r.completed}))}
  const userReviews:UserReview[]=(reviewRows||[]).filter(r=>r.demo_listing_id).map(r=>({id:r.id,placeId:r.demo_listing_id,rating:r.puntuacion,comment:r.comentario,status:r.estado,createdAt:r.created_at,updatedAt:r.updated_at,helpful:r.helpful_count,unhelpful:r.unhelpful_count,reported:false,photos:r.photos||[],businessResponse:r.business_response||""}));
  return {cats,reminders,userReviews,follows:(followRows||[]).map(row=>row.listing_id)};
}

export async function saveCat(userId:string,cat:CatProfile){const db=createClient();if(!db)return;const {error}=await db.from("cats").upsert({id:cat.id,user_id:userId,nombre:cat.name,foto:cat.photo||null,sexo:cat.sex,fecha_nacimiento:cat.birthDate||null,peso:cat.weight||null,fecha_peso:cat.weightDate||null,raza:cat.breed,esterilizado:cat.sterilized,tipo_vida:cat.lifestyle,personalidad:cat.personality||null,veterinaria_habitual:cat.regularVet||null,observaciones_dueno:cat.ownerNotes||null});if(error)throw error;const preferenceResult=await db.from("cat_preferences").upsert({cat_id:cat.id,alimentos:cat.food,arenas:cat.litter,juguetes:cat.toys},{onConflict:"cat_id"});if(preferenceResult.error)throw preferenceResult.error}
export async function deleteCat(id:string){const db=createClient();if(db){const {error}=await db.from("cats").delete().eq("id",id);if(error)throw error}}
export async function saveReminder(r:Reminder){const db=createClient();if(db){const {error}=await db.from("reminders").upsert({id:r.id,cat_id:r.catId,tipo:r.type,fecha:r.date,descripcion:r.description,completed:r.completed});if(error)throw error}}
export async function deleteReminder(id:string){const db=createClient();if(db)await db.from("reminders").delete().eq("id",id)}
export async function saveReview(userId:string,r:UserReview,place:PlaceReference){const db=createClient();if(!db)return;const base={id:r.id,user_id:userId,puntuacion:r.rating,comentario:r.comment,estado:r.status,helpful_count:r.helpful,unhelpful_count:r.unhelpful,photos:r.photos,updated_at:r.updatedAt||r.createdAt,moderation_state:r.status==="En revisión"?"pending":"approved"};const result=place.kind==="business"?await db.from("reviews").upsert({...base,business_id:place.id}):place.kind==="product"?await db.from("reviews").upsert({...base,product_id:place.id}):await db.from("reviews").upsert({...base,demo_listing_id:place.id});if(result.error)throw result.error}
export async function deleteReview(id:string){const db=createClient();if(db)await db.from("reviews").delete().eq("id",id)}
export async function saveDemoFollow(userId:string,listingId:number,follow:boolean){const db=createClient();if(!db)return;if(follow){const {error}=await db.from("demo_follows").upsert({user_id:userId,listing_id:listingId});if(error)throw error}else{const {error}=await db.from("demo_follows").delete().eq("user_id",userId).eq("listing_id",listingId);if(error)throw error}}
export async function uploadCatPhoto(userId:string,catId:string,dataUrl:string){const db=createClient();if(!db)return dataUrl;const blob=await fetch(dataUrl).then(response=>response.blob());const extension=blob.type==="image/png"?"png":blob.type==="image/webp"?"webp":"jpg";const path=`${userId}/${catId}.${extension}`;const {error}=await db.storage.from("cat-photos").upload(path,blob,{contentType:blob.type,upsert:true});if(error)throw error;return db.storage.from("cat-photos").getPublicUrl(path).data.publicUrl}
export type PlaceReference={kind:"business"|"product";id:string}|{kind:"demo";id:number};

export async function loadRecommendationSignals(): Promise<FollowSignal[]> {
  const db = createClient(); if (!db) return [];
  const { data, error } = await db.rpc("recommendation_signals");
  if (error) return [];
  return (data || []).map((row: Record<string, unknown>) => ({
    catId: String(row.cat_id), breed: String(row.breed || ""), birthDate: String(row.birth_date || ""),
    sterilized: Boolean(row.sterilized), lifestyle: row.lifestyle === "Exterior" ? "Exterior" : "Interior",
    preferences: Array.isArray(row.preferences) ? row.preferences.map(String) : [],
    listingId: Number(row.listing_id), wouldChooseAgain: row.would_choose_again !== false
  }));
}
