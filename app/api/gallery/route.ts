import { addGalleryItem, getGalleryItems } from "@/lib/gallery";
import { adminCookieName, isValidAdminSession } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { connection } from "next/server";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function GET() {
  try {
    await connection();
    return Response.json(await getGalleryItems());
  } catch (error) {
    console.error("Failed to load gallery items:", error);
    return Response.json({ error: "Could not load gallery items." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(adminCookieName)?.value)) {
    return Response.json({ error: "Sign in to add gallery items." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Send the image and details as a form." }, { status: 400 });
  }

  const nameValue = formData.get("name");
  const priceValue = formData.get("price");
  const imageValue = formData.get("image");

  if (typeof nameValue !== "string" || typeof priceValue !== "string" || !(imageValue instanceof File)) {
    return Response.json({ error: "Add a name, price, and image." }, { status: 400 });
  }

  const name = nameValue.trim();
  if (name.length === 0 || name.length > 80) {
    return Response.json({ error: "Name must be between 1 and 80 characters." }, { status: 400 });
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(priceValue)) {
    return Response.json({ error: "Enter a price with up to two decimal places." }, { status: 400 });
  }
  const price = Number(priceValue);
  if (!Number.isFinite(price) || price <= 0 || price > 9_999_999_999.99) {
    return Response.json({ error: "Enter a price greater than zero and no more than 9,999,999,999.99." }, { status: 400 });
  }

  const extension = allowedImageTypes.get(imageValue.type);
  if (!extension) {
    return Response.json({ error: "Use a JPEG, PNG, WebP, or GIF image." }, { status: 400 });
  }
  if (imageValue.size === 0 || imageValue.size > maxImageSize) {
    return Response.json({ error: "Image must be smaller than 5 MB." }, { status: 400 });
  }

  const image = new Uint8Array(await imageValue.arrayBuffer());
  if (!matchesImageType(image, extension)) {
    return Response.json({ error: "The selected file is not a valid image of that type." }, { status: 400 });
  }

  try {
    const item = await addGalleryItem(name, price, imageValue, extension, imageValue.type);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Failed to save gallery item:", error);
    return Response.json({ error: "Could not save this item. Please try again." }, { status: 500 });
  }
}

function matchesImageType(image: Uint8Array, extension: string) {
  if (extension === "jpg") {
    return image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
  }
  if (extension === "png") {
    return image.length >= 8
      && image[0] === 0x89
      && image[1] === 0x50
      && image[2] === 0x4e
      && image[3] === 0x47
      && image[4] === 0x0d
      && image[5] === 0x0a
      && image[6] === 0x1a
      && image[7] === 0x0a;
  }
  if (extension === "gif") {
    const signature = new TextDecoder().decode(image.subarray(0, 6));
    return signature === "GIF87a" || signature === "GIF89a";
  }
  return image.length >= 12
    && new TextDecoder().decode(image.subarray(0, 4)) === "RIFF"
    && new TextDecoder().decode(image.subarray(8, 12)) === "WEBP";
}
