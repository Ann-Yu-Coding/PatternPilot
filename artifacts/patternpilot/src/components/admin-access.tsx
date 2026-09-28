import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { listAdminQuestions } from "@workspace/api-client-react";
import { Link } from "wouter";
import "../practice.css";

function AdminSession({
  secret,
  children,
}: {
  secret: string;
  children: (secret: string) => ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      }),
  );
  useEffect(
    () => () => {
      client.clear();
    },
    [client],
  );
  return (
    <QueryClientProvider client={client}>
      {children(secret)}
    </QueryClientProvider>
  );
}

export function AdminAccess({
  children,
}: {
  children: (secret: string) => ReactNode;
}) {
  const [secret, setSecret] = useState("");
  const [authorized, setAuthorized] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (authorized)
    return (
      <>
        <div
          className="learner-page"
          style={{ minHeight: 0, padding: "12px 24px", textAlign: "right" }}
        >
          <button
            className="learner-button secondary"
            onClick={() => setAuthorized("")}
          >
            Lock admin
          </button>
        </div>
        <AdminSession secret={authorized}>{children}</AdminSession>
      </>
    );
  return (
    <div className="learner-page">
      <main className="learner-main" style={{ maxWidth: 420 }}>
        <Link href="/practice" className="learner-brand">
          patternpilot
        </Link>
        <h1 style={{ fontSize: 34, marginTop: 48 }}>Admin access</h1>
        <p>Enter the admin secret to open Question studio.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await listAdminQuestions(undefined, {
                headers: { Authorization: `Bearer ${secret}` },
                cache: "no-store",
              });
              setAuthorized(secret);
              setSecret("");
            } catch {
              setError(
                "Access denied or service unavailable. Check the secret and try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label style={{ display: "block", marginTop: 24 }}>
            Admin secret
            <input
              type="password"
              required
              autoComplete="off"
              value={secret}
              disabled={busy}
              onChange={(e) => setSecret(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 12,
                margin: "8px 0 24px",
                border: "1px solid #e3e4e0",
                borderRadius: 8,
              }}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="learner-button" disabled={busy}>
            {busy ? "Checking…" : "Open Question studio"}
          </button>
        </form>
      </main>
    </div>
  );
}
