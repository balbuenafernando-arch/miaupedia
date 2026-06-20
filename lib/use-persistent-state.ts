"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch { /* An invalid demo cache should never break the app. */ }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return [value, setValue, hydrated] as const;
}

export type CatProfile = {
  id: string; name: string; sex: "Hembra" | "Macho"; breed: string;
  sterilized: boolean; birthDate: string; weight: number; weightDate: string; photo?: string;
  lifestyle: "Interior" | "Exterior"; personality?: string; regularVet?: string; ownerNotes?: string;
  food: string[]; litter: string[]; toys: string[];
};

export type Reminder = {
  id: string; catId: string; type: "Cumpleaños" | "Vacuna" | "Desparasitación" | "Control veterinario" | "Otro";
  date: string; description: string; completed: boolean;
};

export type UserReview = {
  id: string; placeId: number; rating: number; comment: string; status: "Publicada" | "En conversación" | "Resuelta" | "En revisión";
  createdAt: string; updatedAt?: string; helpful: number; unhelpful: number; reported: boolean; photos: string[]; businessResponse?: string;
};

export const defaultCat: CatProfile = {
  id: "demo-luna", name: "Luna", sex: "Hembra", breed: "Europeo de pelo corto",
  sterilized: true, birthDate: "2022-11-03", weight: 4.2, weightDate: "2026-06-01", lifestyle: "Interior", personality: "Curiosa y tranquila", regularVet: "Clínica Felina Miraflores", ownerNotes: "Prefiere espacios tranquilos.",
  photo: "https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&w=700&q=85",
  food: ["Salmón", "Pollo"], litter: ["Aglutinante sin aroma"], toys: ["Varitas", "Pelotas"]
};
