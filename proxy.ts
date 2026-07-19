// ============================================================
// proxy.ts — Route Handling
// ============================================================
// This file replaces "middleware" in Next.js 16.
// Currently passes all requests through — no auth required.
//
// To enable Clerk route protection, add your Clerk keys to
// .env.local and uncomment the protection block below.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";

// Enable when Clerk keys are configured:
// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
// export const proxy = clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoute(req)) await auth.protect();
// });

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
