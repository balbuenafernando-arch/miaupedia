import { createClient } from "@/lib/supabase";
import { legalDocuments, requiredDocuments } from "@/lib/community-legal";

export type Sort = "relevantes" | "recientes" | "utiles";
export type BranchType = "Veterinaria" | "Pet Shop";
export type Freshness = "unconfirmed" | "confirmed" | "changed";
export type Branch = {
  id: string; slug: string; nombre: string; tipo: BranchType; distrito: string; direccion: string;
};
export type Fija = {
  id: string; title: string; body: string; location: string | null; autor: string;
  price: number | null; created_at: string; utiles: number; freshness: Freshness;
  freshness_at: string | null; business_id: string | null; rating: number | null;
};
export type DirectoryItem = Omit<Fija, "autor" | "freshness_at" | "business_id" | "rating"> & {
  autor: string | null; kind: "fija" | "business"; slug: string | null;
  business_type: BranchType | null; average_rating: number | null; experience_count: number | null;
};
type LegacyExperience = {id:string;puntuacion:number;comentario:string|null;created_at:string};
export type CommunityComment = { id: string; autor: string; body: string; created_at: string };
export type UpdateKind = keyof typeof updateLabels;
export type CommunityUpdate = {id: string; kind: UpdateKind; note: string | null; price: number | null; created_at: string};
export type ReportReason = keyof typeof reportLabels;
export const updateLabels = {
  confirmed: "Sigue vigente", price: "Cambió el precio", availability: "Cambió la disponibilidad",
  closed: "El lugar cerró", other: "Otro cambio",
};
export const reportLabels = {
  spam: "Spam", abuse: "Insultos o acoso", personal_data: "Datos personales",
  false_information: "Información presuntamente falsa", other: "Otro incumplimiento",
};
const fijaColumns = "id,title,body,location,autor,price,created_at,utiles,freshness,freshness_at,business_id,rating";
const branchColumns = "id,slug,nombre,tipo,distrito,direccion";

function db() {
  const client = createClient();
  if (!client) throw new Error("La comunidad aún no está disponible.");
  return client;
}

function requireSuccess(error: { code: string } | null, message: string, duplicate?: string) {
  if (error) throw new Error(error.code === "23505" && duplicate ? duplicate : message);
}

export async function searchCommunity(text: string, sort: Sort, page: number, signal: AbortSignal): Promise<{items:DirectoryItem[];more:boolean}> {
  const {data,error} = await db().rpc("search_community", {term:text, ordering:sort,page_offset:page*20})
    .abortSignal(signal).returns<DirectoryItem[]>();
  requireSuccess(error,"No pudimos cargar la búsqueda.");
  const items = Array.isArray(data) ? data : [];
  return {items:items.slice(0,20),more:items.length>20};
}

export async function findFija(id: string, signal: AbortSignal): Promise<Fija | null> {
  const {data,error} = await db().from("fijas").select(fijaColumns).eq("id",id).abortSignal(signal).maybeSingle<Fija>();
  requireSuccess(error,"No pudimos cargar la fija.");
  return data;
}

export async function findBranch(slug: string, signal: AbortSignal): Promise<Branch | null> {
  const {data,error} = await db().from("businesses").select(branchColumns).eq("slug",slug)
    .eq("community_state","approved").abortSignal(signal).maybeSingle<Branch>();
  requireSuccess(error,"No pudimos cargar la sede.");
  return data;
}

export async function findBranches(name: string, district: string, address: string, signal: AbortSignal): Promise<Branch[]> {
  const text = (value: string) => "%" + value.trim().replace(/[\\%_*]/g,c=>"\\"+(c==="*"?"%":c)) + "%";
  let query = db().from("businesses").select(branchColumns).in("tipo",["Veterinaria","Pet Shop"])
    .eq("community_state","approved").ilike("nombre",text(name)).limit(8);
  if (district.trim()) query = query.ilike("distrito",text(district));
  if (address.trim()) query = query.ilike("direccion",text(address));
  const {data,error} = await query.abortSignal(signal).returns<Branch[]>();
  requireSuccess(error,"No pudimos buscar sedes existentes.");
  return data ?? [];
}

export async function branchExperiences(id: string, page: number, signal: AbortSignal): Promise<{items:Fija[];more:boolean;legacy:LegacyExperience[]}> {
  const client = db();
  const start = page*20;
  const [current,legacy] = await Promise.all([
    client.from("fijas").select(fijaColumns).eq("business_id",id).eq("state","published")
      .order("created_at",{ascending:false}).order("id").range(start,start+20).abortSignal(signal).returns<Fija[]>(),
    client.from("reviews").select("id,puntuacion,comentario,created_at").eq("business_id",id)
      .eq("moderation_state","approved").order("created_at",{ascending:false}).limit(20).abortSignal(signal)
      .returns<LegacyExperience[]>(),
  ]);
  requireSuccess(current.error || legacy.error,"No pudimos cargar las experiencias.");
  return {items:(current.data ?? []).slice(0,20),more:(current.data?.length ?? 0)>20,legacy:legacy.data ?? []};
}

export async function checkCommunityAcceptance() {
  const {data,error} = await db().rpc("community_can_write");
  requireSuccess(error,"No pudimos verificar tu aceptación. Inténtalo de nuevo.");
  return data === true;
}

export async function acceptCommunityDocuments() {
  const {error} = await db().from("community_acceptances").upsert(
    requiredDocuments.map(document => ({document,version:legalDocuments[document].version})),
    {onConflict:"user_id,document,version",ignoreDuplicates:true},
  );
  requireSuccess(error,"No pudimos guardar la aceptación. Vuelve a intentarlo.");
  if (!await checkCommunityAcceptance()) throw new Error("Las versiones cambiaron. Recarga y revísalas.");
}

export async function publishCommunity(input: {
  id: string; title: string; body: string; location: string; price: number | null;
  branch: Branch | null; rating: number | null;
  proposal: {type: BranchType; name: string; district: string; address: string} | null;
}) {
  const {data,error} = await db().rpc("pasar_la_voz", {
    post_id:input.id,post_title:input.title,post_body:input.body,post_location:input.location || null,
    post_price:input.price,branch_id:input.branch?.id ?? null,stars:input.rating,
    branch_type:input.proposal?.type ?? null,branch_name:input.proposal?.name ?? null,
    branch_district:input.proposal?.district ?? null,branch_address:input.proposal?.address ?? null,
  });
  requireSuccess(error,"No pudimos publicar. Revisa los datos e inténtalo de nuevo.",
    input.proposal ? "Esta sede ya existe o está en revisión. Busca la ficha antes de volver a enviarla." : "Esta experiencia ya se registró.");
  if (typeof data !== "string") throw new Error("No pudimos confirmar la publicación.");
  return data;
}

export async function loadFijaActivity(id: string, signal: AbortSignal): Promise<{comments:CommunityComment[];updates:CommunityUpdate[]}> {
  const client = db();
  const [comments,updates] = await Promise.all([
    client.from("fija_comments").select("id,autor,body,created_at").eq("fija_id",id)
      .order("created_at",{ascending:false}).limit(50).abortSignal(signal).returns<CommunityComment[]>(),
    client.from("fija_updates").select("id,kind,note,price,created_at").eq("fija_id",id)
      .order("created_at",{ascending:false}).order("id",{ascending:false}).limit(20).abortSignal(signal).returns<CommunityUpdate[]>(),
  ]);
  requireSuccess(comments.error || updates.error,"No pudimos cargar los comentarios y actualizaciones.");
  return {comments:comments.data ?? [],updates:updates.data ?? []};
}

export async function getCommunityMarks(id: string, signal: AbortSignal) {
  const client = db();
  const [vote,save] = await Promise.all([
    client.from("fija_votes").select("fija_id").eq("fija_id",id).abortSignal(signal).maybeSingle(),
    client.from("fija_saves").select("fija_id").eq("fija_id",id).abortSignal(signal).maybeSingle(),
  ]);
  requireSuccess(vote.error || save.error,"No pudimos cargar tus acciones.");
  return {vote:Boolean(vote.data),save:Boolean(save.data)};
}

export async function setCommunityMark(kind: "vote" | "save", id: string, enabled: boolean) {
  const table = db().from(kind === "vote" ? "fija_votes" : "fija_saves");
  const {error} = enabled ? await table.upsert({fija_id:id},{ignoreDuplicates:true,onConflict:"fija_id,user_id"})
    : await table.delete().eq("fija_id",id);
  requireSuccess(error,"No pudimos guardar tu acción.");
}

export async function listSavedFijas(signal: AbortSignal): Promise<Fija[]> {
  const {data,error} = await db().from("fija_saves").select(`fijas(${fijaColumns})`)
    .order("created_at",{ascending:false}).abortSignal(signal).returns<{fijas:Fija | null}[]>();
  requireSuccess(error,"No pudimos cargar tus guardados.");
  const rows: {fijas:Fija | null}[] = data ?? [];
  return rows.flatMap(row=>row.fijas ? [row.fijas] : []);
}

export async function addCommunityComment(id: string, fijaId: string, body: string) {
  const {error} = await db().from("fija_comments").upsert({id,fija_id:fijaId,body},
    {onConflict:"id",ignoreDuplicates:true});
  requireSuccess(error,"No pudimos publicar el comentario.");
}

export async function addCommunityUpdate(id: string, fijaId: string, kind: UpdateKind, note: string, price: number|null) {
  const {error} = await db().from("fija_updates").upsert({id,fija_id:fijaId,kind,note:note || null,price},
    {onConflict:"id",ignoreDuplicates:true});
  requireSuccess(error,"No pudimos guardar el cambio.");
}

export async function reportCommunity(fijaId: string, reason: ReportReason, target?: {kind:"comment"|"update";id:string}) {
  const {error} = await db().from("fija_reports").insert({fija_id:fijaId,reason,
    comment_id:target?.kind === "comment" ? target.id : null,
    update_id:target?.kind === "update" ? target.id : null});
  requireSuccess(error,"No pudimos enviar el reporte.","Ya enviaste un reporte sobre este contenido.");
}
