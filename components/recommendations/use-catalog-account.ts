"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export function useCatalogAccount() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUserId(session && !session.user.is_anonymous ? session.user.id : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return userId;
}
