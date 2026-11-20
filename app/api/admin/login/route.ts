import {
  adminCookieName,
  adminSessionMaxAge,
  createAdminSessionToken,
  isAdminCredentialsConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2048) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send the username and password as JSON." }, { status: 400 });
  }

  if (!isAdminCredentialsConfigured()) {
    return Response.json(
      { error: "Admin access is not configured. Set GALARY_ADMIN_USERNAME and GALARY_ADMIN_PASSWORD in .env.local." },
      { status: 503 },
    );
  }

  if (typeof body !== "object" || body === null || !("username" in body) || !("password" in body)
    || typeof body.username !== "string" || typeof body.password !== "string"
    || body.username.length > 256 || body.password.length > 1024
    || !verifyAdminCredentials(body.username, body.password)) {
    return Response.json({ error: "That username or password is not correct." }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const response = Response.json({ success: true });
  response.headers.append(
    "Set-Cookie",
    `${adminCookieName}=${createAdminSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${adminSessionMaxAge}${secure}`,
  );
  return response;
}
