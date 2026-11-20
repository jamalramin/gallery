import { adminCookieName } from "@/lib/admin-auth";

export async function POST() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const response = Response.json({ success: true });
  response.headers.append(
    "Set-Cookie",
    `${adminCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
  return response;
}
