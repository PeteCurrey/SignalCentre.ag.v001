import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Signal Center account.",
};

export default function SignInPage() {
  const hasClerkKeys =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_") &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("replace_with");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-warm)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
      }}
    >
      {/* Brand mark */}
      <div style={{ marginBottom: "var(--space-10)", textAlign: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ marginBottom: "var(--space-2)" }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "var(--navy)",
              }}
            >
              SIGNAL
            </span>
            <span
              style={{
                width: "1px",
                height: "14px",
                backgroundColor: "var(--platinum)",
                margin: "0 8px",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1rem",
                fontWeight: 300,
                letterSpacing: "0.12em",
                color: "var(--navy)",
              }}
            >
              CENTER
            </span>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
            }}
          >
            Market Intelligence
          </p>
        </Link>
      </div>

      {hasClerkKeys ? (
        // Dynamically rendered when Clerk is configured
        <ClerkSignIn />
      ) : (
        /* Auth placeholder — shown when Clerk keys are not yet configured */
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-base)",
            padding: "var(--space-10)",
          }}
        >
          <h1
            style={{
              fontSize: "1.125rem",
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: "var(--space-2)",
            }}
          >
            Sign In
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              lineHeight: 1.7,
              marginBottom: "var(--space-8)",
            }}
          >
            Authentication is not yet configured. Add your Clerk API keys to{" "}
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                backgroundColor: "var(--bg-stone)",
                padding: "1px 5px",
              }}
            >
              .env.local
            </code>{" "}
            to enable sign-in.
          </p>

          <div
            style={{
              padding: "var(--space-5)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-stone)",
              marginBottom: "var(--space-6)",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                lineHeight: 1.8,
              }}
            >
              1. Visit{" "}
              <span style={{ color: "var(--navy)", fontWeight: 500 }}>
                clerk.com
              </span>{" "}
              → create app
              <br />
              2. Copy{" "}
              <span style={{ color: "var(--navy)" }}>
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
              </span>
              <br />
              3. Copy{" "}
              <span style={{ color: "var(--navy)" }}>CLERK_SECRET_KEY</span>
              <br />
              4. Paste both into{" "}
              <span style={{ color: "var(--navy)" }}>.env.local</span>
            </p>
          </div>

          <Link
            href="/dashboard"
            style={{
              display: "block",
              padding: "11px 20px",
              textAlign: "center",
              backgroundColor: "var(--navy)",
              color: "var(--bg-base)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.02em",
              marginBottom: "var(--space-4)",
            }}
          >
            Continue to Dashboard →
          </Link>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--text-disabled)",
            }}
          >
            Dashboard is fully accessible in development mode
          </p>
        </div>
      )}
    </div>
  );
}

// Loaded only when Clerk keys exist
async function ClerkSignIn() {
  const { SignIn } = await import("@clerk/nextjs");
  return <SignIn />;
}
