import { getCertificateById, getCertificateItem, listCertificateItems } from "@/lib/db";
import { fetchPageImage } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * Streams one rendered page of a certificate document.
 *
 * Documents live on Cloudinary under authenticated delivery, so their real URLs
 * return 401. This route signs the request server-side and streams back a page
 * image — the original PDF is never delivered, and the Cloudinary URL never
 * reaches the browser. Only documents belonging to a published certificate are
 * served.
 */
export async function GET(request, { params }) {
  const { kind, id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("p")) || 1);
  const width = searchParams.get("w");

  let publicId = null;
  let pageCount = 1;

  if (kind === "item") {
    const item = getCertificateItem(id);
    if (item) {
      const parent = getCertificateById(item.certificateId);
      if (parent?.published) {
        publicId = item.assetPublicId;
        pageCount = item.pageCount;
      }
    }
  } else if (kind === "cert") {
    const cert = getCertificateById(id);
    if (cert?.published) {
      publicId = cert.assetPublicId;
      pageCount = cert.pageCount;
      // A bundle with no cover of its own falls back to its first document.
      if (!publicId) {
        const first = listCertificateItems(cert.id).find((i) => i.assetPublicId);
        publicId = first?.assetPublicId ?? null;
        pageCount = first?.pageCount ?? 1;
      }
    }
  } else {
    return new Response("Unknown media kind.", { status: 400 });
  }

  if (!publicId) return new Response("Not found.", { status: 404 });
  if (page > pageCount) return new Response("No such page.", { status: 404 });

  return fetchPageImage(publicId, { page, width });
}
