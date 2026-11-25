import type { User } from "@supabase/supabase-js";

export function googleAvatarSources(user:User) {
  const identities = user.identities?.filter(identity=>identity.provider==="google") ?? [];
  const values:unknown[] = [
    ...identities.flatMap(identity=>[identity.identity_data?.picture,identity.identity_data?.avatar_url]),
    user.user_metadata.avatar_url,user.user_metadata.picture,
  ];
  const candidates=new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    try {
      const url=new URL(value);
      if (url.protocol!=="https:" || !/^lh[1-9]\.googleusercontent\.com$/.test(url.hostname) ||
          url.username || url.password || url.port) continue;
      candidates.add(url.href);
      if (/=s\d+(?:-[a-z]+)*$/.test(url.pathname)) {
        url.pathname=url.pathname.replace(/=s\d+(?:-[a-z]+)*$/,"=s128-c");
        candidates.add(url.href);
      }
    } catch {}
  }
  return [...candidates];
}
