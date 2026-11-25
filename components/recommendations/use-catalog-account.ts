"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

export function useCatalogUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const client = createClient();
    if (!client) { setUser(null); return; }
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session && !session.user.is_anonymous ? session.user : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
}

export function useCatalogAccount() {
  const user = useCatalogUser();
  return user ? user.id : user;
}
