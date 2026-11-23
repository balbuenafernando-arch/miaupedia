"use client";

import { useRef, useState, type FormEvent } from "react";
import { reviewNeedsModeration, validateCommunityContent } from "@/lib/content-filter";
import { submitProductReview } from "@/lib/product-catalog";

export function ProductReviewForm({ productId, userId, onSaved }: {
  productId: string;
  userId: string;
  onSaved: (pending: boolean) => void;
}) {
  const draftId = useRef<string>(null);
  const inFlight = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const rating = Number(data.get("rating"));
    const comment = String(data.get("comment")).trim();
    const pros = String(data.get("pros")).trim();
    const cons = String(data.get("cons")).trim();
    // Optional short fields share the same community rules without a minimum length.
    const validation = validateCommunityContent(comment) ||
      validateCommunityContent([comment, pros, cons].join("\n"));
    if (validation || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      setError(validation || "Elige una calificación entre 1 y 5.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError("");
    const pending = [comment, pros, cons].some(reviewNeedsModeration);
    draftId.current ??= crypto.randomUUID();
    try {
      await submitProductReview(productId, userId, {
        id: draftId.current, rating, comment, pros, cons, pending,
      });
      draftId.current = null;
      form.reset();
      onSaved(pending);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la reseña.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return <form className="catalog-panel stack-form" onSubmit={submit}
    onChange={() => { draftId.current = null; }}>
    <h3>Escribe una reseña</h3>
    <fieldset disabled={saving} className="catalog-review-fields">
      <label>Calificación
        <select name="rating" required defaultValue="">
          <option value="" disabled>Elige una calificación</option>
          {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} de 5</option>)}
        </select>
      </label>
      <label>Comentario
        <textarea name="comment" required minLength={12} maxLength={3000} rows={4} />
      </label>
      <label>Ventajas (opcional)<textarea name="pros" maxLength={500} rows={2} /></label>
      <label>Desventajas (opcional)<textarea name="cons" maxLength={500} rows={2} /></label>
      <button className="primary">{saving ? "Guardando…" : "Enviar reseña"}</button>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
