import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const hostname = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  let appHost = "";
  try {
    appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase()
      : "";
  } catch {
    appHost = "";
  }
  const configuredHosts = [
    (process.env.NEXT_PUBLIC_APP_HOSTNAME || "").toLowerCase(),
    appHost,
    ...(process.env.NEXT_PUBLIC_APP_HOSTNAMES || "")
      .split(",")
      .map((host) => host.trim().toLowerCase()),
  ].filter(Boolean);
  const isPlatformHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app") ||
    configuredHosts.includes(hostname);
  let response: NextResponse;
  let customDomainDestination: typeof request.nextUrl | null = null;

  if (!isPlatformHost) {
    if (!url || !key) return new NextResponse("Not Found", { status: 404 });
    try {
      const lookup = await fetch(
        `${url.replace(/\/$/, "")}/rest/v1/rpc/resolve_custom_domain`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hostname }),
          cache: "no-store",
        },
      );
      const storeSlug = lookup.ok
        ? ((await lookup.json()) as string | null)
        : null;
      if (!storeSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(storeSlug))
        return new NextResponse("Not Found", { status: 404 });
      const destination = request.nextUrl.clone();
      if (
        !destination.pathname.startsWith("/api/") &&
        !destination.pathname.startsWith("/_next/")
      )
        destination.pathname = `/s/${storeSlug}`;
      customDomainDestination = destination;
      response = NextResponse.rewrite(destination, { request });
    } catch {
      return new NextResponse("Store temporarily unavailable", { status: 503 });
    }
  } else {
    response = NextResponse.next({ request });
  }

  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = customDomainDestination
          ? NextResponse.rewrite(customDomainDestination, { request })
          : NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
