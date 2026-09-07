import { getPhoto } from "@/lib/gallery-db";
import { pageTransformation } from "@/lib/book-media";
import { fetchSignedImage } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * One published photograph, cropped and tone-corrected on the way out.
 *
 * The stored file uses authenticated delivery, so it is only reachable through
 * this proxy — a browser never receives a Cloudinary URL. Unpublished
 * photographs are not served at all.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const width = Number(searchParams.get("w")) || 1200;

  const photo = getPhoto(id);
  if (!photo?.publicId || !photo.published) {
    return new Response("Not found.", { status: 404 });
  }

  return fetchSignedImage(
    photo.publicId,
    pageTransformation({ crop: photo.crop, filters: photo.filters, width }),
    { versioned: !!searchParams.get("v") }
  );
}
