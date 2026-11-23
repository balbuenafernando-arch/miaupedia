"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(error => {
      console.warn("Miaupedia no pudo preparar la página sin conexión.", error);
    });
  }, []);
  return null;
}
