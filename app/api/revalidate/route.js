import { revalidatePath } from "next/cache";
import crypto from "node:crypto";

/**
 * Called by the separate portfolio_admin app after it saves a certificate.
 * Because the admin runs as its own process, it cannot call revalidatePath()
 * on this app directly — it posts here instead.
 *
 * Guarded by a shared secret so nobody else can force cache churn.
 */
export async function POST(request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return Response.json({ error: "REVALIDATE_SECRET is not configured." }, { status: 500 });
  }

  let provided = "";
  try {
    provided = String((await request.json())?.secret ?? "");
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Certificates appear on the home page, every domain route and the wall.
  revalidatePath("/", "layout");

  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
