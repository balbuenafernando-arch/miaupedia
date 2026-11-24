"use client";

import { useRef, useState, type FormEvent } from "react";
import { AuthModal } from "@/components/functional-modals";
import { validateCommunityContent } from "@/lib/content-filter";
import { categoryLabels, parseCategory, proposeProduct } from "@/lib/product-catalog";
import { useCatalogAccount } from "./use-catalog-account";

export function ProductProposal() {
  const userId = useCatalogAccount();
  const [authOpen, setAuthOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  return <div className="catalog-proposal">
    {!(open && userId) && <button className="primary" disabled={userId === undefined} onClick={() => {
      setMessage("");
      if (userId) setOpen(true);
      else setAuthOpen(true);
    }}>Proponer una ficha</button>}
    {open && userId && <ProposalForm key={userId} userId={userId} onClose={() => setOpen(false)}
      onSaved={() => {
        setMessage("Recibimos tu ficha. Aparecerá en el catálogo si se aprueba.");
        setOpen(false);
      }} />}
    {message && <p role="status">{message}</p>}
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={() => {
      setAuthOpen(false);
      setOpen(true);
    }} />}
  </div>;
}

function ProposalForm({ userId, onClose, onSaved }: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const inFlight = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const category = parseCategory(String(data.get("category")));
    const description = String(data.get("description")).trim();
    const validation = validateCommunityContent(name, 2) || validateCommunityContent(description, 0);
    if (!category || validation) {
      setError(validation || "Selecciona una categoría.");
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError("");
    try {
      await proposeProduct(userId, { name, category, description });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos enviar la ficha.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return <form className="catalog-panel stack-form" onSubmit={submit}>
    <h2>Propón un producto</h2>
    <p>Incluye la marca y la variante en el nombre para distinguirlo de otros productos.</p>
    <fieldset className="catalog-review-fields" disabled={saving}>
      <label>Nombre de la ficha<input name="name" minLength={2} maxLength={120} required /></label>
      <label>Categoría de la ficha
        <select name="category" required defaultValue="">
          <option value="" disabled>Elige una categoría</option>
          {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label>Descripción (opcional)<textarea name="description" maxLength={1000} rows={3} /></label>
      <div className="catalog-proposal-actions">
        <button className="primary">{saving ? "Enviando…" : "Enviar ficha a revisión"}</button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </div>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
