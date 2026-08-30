import { getBook, getPage } from "@/lib/book-db";
import { getSection } from "@/lib/library-db";
import { pageTransformation } from "@/lib/book-media";
import { fetchSignedImage } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * One page of a book, cropped and tone-corrected on the way out.
 *
 * Only pages of a published book on a published shelf are served, and the
 * stored image is only reachable through this signing proxy.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const width = Number(searchParams.get("w")) || 1200;

  const page = getPage(id);
  if (!page?.imagePublicId) return new Response("Not found.", { status: 404 });

  const book = getBook(page.bookId);
  if (!book?.published || !getSection(book.sectionId)?.published) {
    return new Response("Not found.", { status: 404 });
  }

  return fetchSignedImage(
    page.imagePublicId,
    pageTransformation({ crop: page.crop, filters: page.filters, width }),
    { versioned: !!searchParams.get("v") }
  );
}
