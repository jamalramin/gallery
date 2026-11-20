import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const adminCookieName = "forma_admin";
export const adminSessionMaxAge = 8 * 60 * 60;

function getAdminCredentials() {
  return {
    username: process.env.GALARY_ADMIN_USERNAME ?? process.env.GALLERY_ADMIN_USERNAME,
    password: process.env.GALARY_ADMIN_PASSWORD ?? process.env.GALLERY_ADMIN_PASSWORD,
  };
}

export function isAdminCredentialsConfigured() {
  const { username, password } = getAdminCredentials();
  return Boolean(username && password && password.length >= 3);
}

export function verifyAdminCredentials(candidateUsername: string, candidatePassword: string) {
  const { username, password } = getAdminCredentials();
  if (!username || !password || password.length < 3) {
    return false;
  }

  const usernameMatches = matchesSecret(candidateUsername, username);
  const passwordMatches = matchesSecret(candidatePassword, password);
  return usernameMatches && passwordMatches;
}

export function createAdminSessionToken(now = Date.now()) {
  const issuedAt = Math.floor(now / 1000).toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function isValidAdminSession(token: string | undefined, now = Date.now()) {
  const { username, password } = getAdminCredentials();
  if (!username || !password || password.length < 3 || !token) {
    return false;
  }

  const [issuedAt, signature, ...extraParts] = token.split(".");
  if (!issuedAt || !/^\d+$/.test(issuedAt) || !signature || extraParts.length > 0) {
    return false;
  }

  const issuedAtSeconds = Number(issuedAt);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(issuedAtSeconds)
    || issuedAtSeconds > nowSeconds + 60
    || nowSeconds - issuedAtSeconds > adminSessionMaxAge) {
    return false;
  }

  const expected = sign(issuedAt);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function sign(value: string) {
  const { username, password } = getAdminCredentials();
  if (!username || !password) {
    throw new Error("Admin credentials are not configured.");
  }
  return createHmac("sha256", `${username}\0${password}`)
    .update(value)
    .digest("base64url");
}

function matchesSecret(candidate: string, expected: string) {
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}
