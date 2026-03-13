// Middleware: Cloudflare Access JWT verification
// Staff endpoints require valid CF Access JWT

export interface AuthContext {
  email: string;
  name: string;
}

/**
 * Verify Cloudflare Access JWT from request headers.
 * In development, skip verification if CF_ACCESS_TEAM is not set.
 */
export async function verifyStaffAccess(request: Request, env: Record<string, string>): Promise<AuthContext | null> {
  const teamDomain = env.CF_ACCESS_TEAM;

  // Development mode: skip auth
  if (!teamDomain) {
    return { email: "dev@localhost", name: "Developer" };
  }

  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) return null;

  try {
    // Fetch CF Access public keys
    const certsUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
    const certsResp = await fetch(certsUrl);
    const certs = await certsResp.json() as { keys: JsonWebKey[] };

    // Decode JWT header to find kid
    const [headerB64] = jwt.split(".");
    const header = JSON.parse(atob(headerB64));
    const key = (certs.keys as any[]).find((k: any) => k.kid === header.kid);
    if (!key) return null;

    // Import key and verify
    const cryptoKey = await crypto.subtle.importKey(
      "jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
    );

    const [, payloadB64, sigB64] = jwt.split(".");
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64));
    return { email: payload.email || "", name: payload.email?.split("@")[0] || "" };
  } catch {
    return null;
  }
}

/** Middleware wrapper: returns 401 if not authenticated */
export async function requireAuth(request: Request, env: Record<string, string>): Promise<AuthContext | Response> {
  const auth = await verifyStaffAccess(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return auth;
}
