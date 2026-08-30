import { getPaper, getSection } from "@/lib/library-db";
import { fetchPageImage } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * Streams one rendered page of a research paper.
 *
 * The PDF lives on Cloudinary under authenticated delivery, so its own URL
 * returns 401. This route signs the request server-side and returns a page
 * image — the source file is never delivered, and only papers in a published
 * section are served.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("p")) || 1);
  const width = searchParams.get("w");

  const paper = getPaper(id);
  if (!paper?.assetPublicId || !paper.published) {
    return new Response("Not found.", { status: 404 });
  }
  if (!getSection(paper.sectionId)?.published) {
    return new Response("Not found.", { status: 404 });
  }
  if (page > paper.pageCount) return new Response("No such page.", { status: 404 });

  return fetchPageImage(paper.assetPublicId, { page, width });
}
