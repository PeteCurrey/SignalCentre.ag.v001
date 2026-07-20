// ============================================================
// proxy.ts — Route Handling (Next.js 16 replacement for middleware.ts)
// ============================================================
// Guards /dashboard, /account, and /alerts behind Clerk auth.
// When Clerk keys are not configured (local dev without keys),
// falls back to pass-through so the build never hard-crashes.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";

function getHasClerkKeys() {
  return (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_") &&
    process.env.CLERK_SECRET_KEY?.startsWith("sk_")
  );
}

// Routes that require a signed-in user
const PROTECTED_PREFIXES = ["/dashboard", "/account", "/alerts"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

// ── Clerk path (when keys are present) ───────────────────────
async function withClerk(req: NextRequest) {
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/account(.*)",
    "/alerts(.*)",
  ]);

  return clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) {
      const { userId } = await auth();
      if (!userId) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return NextResponse.redirect(signInUrl);
      }
    }
    return NextResponse.next();
  })(req, {} as never);
}

// ── Fallback path (no Clerk keys) ────────────────────────────
function withoutClerk(req: NextRequest) {
  // In local dev without Clerk, allow open access to dashboard
  // so the user can test the app without setting up Clerk.
  /*
  if (isProtected(req.nextUrl.pathname)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
  */
  return NextResponse.next();
}

export async function proxy(req: NextRequest) {
  if (getHasClerkKeys()) {
    return withClerk(req);
  }
  return withoutClerk(req);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
