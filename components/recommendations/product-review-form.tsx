"use client";

import { useRef, useState, type FormEvent } from "react";
import { reviewNeedsModeration, validateCommunityContent } from "@/lib/content-filter";
import { reviewReasonKeys, reviewReasons, submitProductReview } from "@/lib/product-catalog";

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
    const reasons = reviewReasonKeys.filter(reason => data.getAll("reason").includes(reason));
    const validation = validateCommunityContent(comment, 0);
    if (validation || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      setError(validation || "Elige una calificación entre 1 y 5.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError("");
    const pending = reviewNeedsModeration(comment);
    draftId.current ??= crypto.randomUUID();
    try {
      await submitProductReview(productId, userId, {
        id: draftId.current, rating, comment, reasons, pending,
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
      <fieldset className="catalog-choice-group">
        <legend>Calificación</legend>
        <div className="catalog-choices catalog-stars">
          {[1, 2, 3, 4, 5].map(value => <label key={value}>
            <input type="radio" name="rating" value={value} required />
            <span>{value} ★</span>
          </label>)}
        </div>
      </fieldset>
      <fieldset className="catalog-choice-group">
        <legend>Motivos (opcional)</legend>
        <div className="catalog-choices">
          {reviewReasonKeys.map(reason => <label key={reason}>
            <input type="checkbox" name="reason" value={reason} />
            <span>{reviewReasons[reason]}</span>
          </label>)}
        </div>
      </fieldset>
      <label>Comentario (opcional)
        <textarea name="comment" maxLength={3000} rows={4} />
      </label>
      <button className="primary">{saving ? "Guardando…" : "Enviar reseña"}</button>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
