import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { googleCallbackPath, googleReturnCookie, googleReturnPath } from "@/lib/google-auth";

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const secure = new URL(origin).protocol === "https:";
  const code = request.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const next = googleReturnPath(request.cookies.get(googleReturnCookie)?.value);
  const response = NextResponse.redirect(new URL("/auth/error", origin), {
    status: 303,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
  response.cookies.set(googleReturnCookie, "", {
    path: googleCallbackPath,
    maxAge: 0,
    sameSite: "lax",
    secure,
  });

  if (!code || !url || !key || request.nextUrl.searchParams.has("error")) return response;

  const supabase = createServerClient(url, key, {
    cookieOptions: { secure },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) response.headers.set("Location", new URL(next, origin).href);
  return response;
}
