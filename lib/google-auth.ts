export const googleCallbackPath = "/auth/callback";
export const googleReturnCookie = "miaupedia-oauth-return";

export function googleReturnPath(path?: string) {
  return path && /^\/(?:recomendaciones(?:\/[a-zA-Z0-9_-]+)?|pasar-la-voz|guardados|perfil|fijas\/[0-9a-f-]+|sedes\/[a-zA-Z0-9_-]+|espacio-personal\/(?:mis-gatos|agenda))$/.test(path) ? path : "/";
}

export async function googleSignInAvailable(signal: AbortSignal) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  const response = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    cache: "no-store",
    signal,
  });
  if (!response.ok) return false;
  const settings: { external?: { google?: boolean } } = await response.json();
  return settings.external?.google === true;
}
