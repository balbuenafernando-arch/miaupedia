"use client";

import { useCallback,useState } from "react";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { canEditPin,readPin,savePin } from "@/lib/fija-geolocation";
import { LocationField,PublicPin,type LocationValue } from "./fija-location";
import { useCommunityAccess } from "./community-shell";

export function FijaLocationDetail({id,legacy}: {id:string;legacy:string|null}) {
  const {userId}=useCommunityAccess();
  const load=useCallback(async(signal:AbortSignal)=>{
    const [pin,owner]=await Promise.all([readPin(id,signal),userId?canEditPin(id,signal):false]);
    return {pin,owner};
  },[id,userId]);
  const {resource,refresh}=useCatalogResource(load);
  const [draft,setDraft]=useState<LocationValue|null>(null);
  const [legacyOverride,setLegacyOverride]=useState<{value:string|null}>();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const visibleLegacy=legacyOverride?legacyOverride.value:legacy;
  const pin=resource.status==="ready"?resource.data.pin:null;
  return <>
    <PublicPin key={pin?`${pin.lat}:${pin.lon}`:"sin-pin"} pin={pin} legacy={visibleLegacy}/>
    {resource.status==="ready" && resource.data.owner && !draft &&
      <button type="button" className="community-link-button" onClick={()=>setDraft({pin,legacy:pin?null:visibleLegacy})}>Editar ubicación</button>}
    {draft && !!userId && <div className="community-form community-panel">
      <LocationField value={draft} onChange={setDraft}/>
      {error && <p className="community-error" role="alert">{error}</p>}
      <div className="community-actions">
        <button type="button" className="community-primary" disabled={draft.pending || busy} onClick={async()=>{
          setBusy(true);setError("");
          try {await savePin(id,draft.pin,draft.legacy);setLegacyOverride({value:draft.legacy});setDraft(null);refresh();}
          catch {setError("No pudimos guardar la ubicación.");}
          finally {setBusy(false);}
        }}>Guardar ubicación</button>
        <button type="button" className="community-link-button" disabled={busy} onClick={()=>{setDraft(null);setError("");}}>Cancelar edición</button>
      </div>
    </div>}
  </>;
}
