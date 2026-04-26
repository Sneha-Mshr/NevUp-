import * as jose from "jose";

const SIGNING_SECRET =
  "97791d4db2aa5f689c3cc39356ce35762f0a73aa70923039d8ef72a2840a1b02";

const secret = new TextEncoder().encode(SIGNING_SECRET);

export async function generateToken(
  userId: string,
  name?: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new jose.SignJWT({
    sub: userId,
    iat: now,
    exp: now + 86400,
    role: "trader",
    ...(name ? { name } : {}),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export interface TraderInfo {
  userId: string;
  name: string;
  pathology: string;
}

export const SEED_TRADERS: TraderInfo[] = [
  { userId: "f412f236-4edc-47a2-8f54-8763a6ed2ce8", name: "Alex Mercer", pathology: "revenge_trading" },
  { userId: "fcd434aa-2201-4060-aeb2-f44c77aa0683", name: "Jordan Lee", pathology: "overtrading" },
  { userId: "84a6a3dd-f2d0-4167-960b-7319a6033d49", name: "Sam Rivera", pathology: "fomo_entries" },
  { userId: "4f2f0816-f350-4684-b6c3-29bbddbb1869", name: "Casey Kim", pathology: "plan_non_adherence" },
  { userId: "75076413-e8e8-44ac-861f-c7acb3902d6d", name: "Morgan Bell", pathology: "premature_exit" },
  { userId: "8effb0f2-f16b-4b5f-87ab-7ffca376f309", name: "Taylor Grant", pathology: "loss_running" },
  { userId: "50dd1053-73b0-43c5-8d0f-d2af88c01451", name: "Riley Stone", pathology: "session_tilt" },
  { userId: "af2cfc5e-c132-4989-9c12-2913f89271fb", name: "Drew Patel", pathology: "time_of_day_bias" },
  { userId: "9419073a-3d58-4ee6-a917-be2d40aecef2", name: "Quinn Torres", pathology: "position_sizing_inconsistency" },
  { userId: "e84ea28c-e5a7-49ef-ac26-a873e32667bd", name: "Avery Chen", pathology: "" },
];
