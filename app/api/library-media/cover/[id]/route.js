import { getBook } from "@/lib/book-db";
import { getSection } from "@/lib/library-db";
import { pageTransformation } from "@/lib/book-media";
import { fetchSignedImage } from "@/lib/media";

export const dynamic = "force-dynamic";

/** A published book's front or back cover, cropped and toned on the way out. */
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const width = Number(searchParams.get("w")) || 900;
  const side = searchParams.get("side") === "back" ? "back" : "front";

  const book = getBook(id);
  if (!book?.published || !getSection(book.sectionId)?.published) {
    return new Response("Not found.", { status: 404 });
  }

  const cover = book.covers?.[side];
  if (!cover) return new Response("Not found.", { status: 404 });

  return fetchSignedImage(
    cover.publicId,
    pageTransformation({ crop: cover.crop, filters: cover.filters, width }),
    { versioned: !!searchParams.get("v") }
  );
}
