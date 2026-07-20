import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Request Access",
  description: "Create your Signal Centre account.",
};

export default function SignUpPage() {
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
        <ClerkSignUp />
      ) : (
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
            Request Access
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              lineHeight: 1.7,
              marginBottom: "var(--space-8)",
            }}
          >
            Authentication will be enabled once Clerk keys are configured.
            The full platform is accessible in development mode without sign-up.
          </p>
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
            }}
          >
            Continue to Dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}

async function ClerkSignUp() {
  const { SignUp } = await import("@clerk/nextjs");
  return <SignUp />;
}
