import { del, put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
import path from "node:path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString || !process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error("Set DATABASE_URL and BLOB_READ_WRITE_TOKEN before migrating local gallery items.");
}

const sql = neon(connectionString);
const galleryPath = path.join(process.cwd(), "data", "gallery.json");
const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
const contentTypes = new Map([
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
]);

let items;
try {
  items = JSON.parse(await readFile(galleryPath, "utf8"));
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    console.log("No local gallery file found; nothing to migrate.");
    process.exit(0);
  }
  throw error;
}

if (!Array.isArray(items)) {
  throw new Error("Local gallery data must be a JSON array.");
}

let migrated = 0;
let skipped = 0;

for (const item of items) {
  if (!isGalleryItem(item)) {
    throw new Error("Local gallery contains an invalid item.");
  }

  const existing = await sql`SELECT id FROM gallery_items WHERE id = ${item.id}::uuid`;
  if (existing.length > 0) {
    skipped += 1;
    continue;
  }

  const fileName = item.imageUrl.slice("/uploads/".length);
  const extension = path.extname(fileName).slice(1).toLowerCase();
  const contentType = contentTypes.get(extension);
  if (!contentType || path.basename(fileName) !== fileName) {
    throw new Error(`Unsupported local image path for item ${item.id}.`);
  }

  const image = await readFile(path.join(uploadsDirectory, fileName));
  const blob = await put(`gallery/${item.id}.${extension}`, new Blob([image], { type: contentType }), {
    access: "public",
    addRandomSuffix: false,
    contentType,
  });

  try {
    const inserted = await sql`
      INSERT INTO gallery_items (id, name, price, image_url, created_at)
      VALUES (${item.id}::uuid, ${item.name}, ${item.price}, ${blob.url}, ${item.createdAt})
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    if (inserted.length === 0) {
      await del(blob.url);
      skipped += 1;
    } else {
      migrated += 1;
    }
  } catch (error) {
    try {
      await del(blob.url);
    } catch (cleanupError) {
      console.error("Could not remove a migrated image after a database error:", cleanupError);
    }
    throw error;
  }
}

console.log(`Migration finished: ${migrated} item(s) moved, ${skipped} already present.`);

function isGalleryItem(value) {
  return typeof value === "object"
    && value !== null
    && typeof value.id === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id)
    && typeof value.name === "string"
    && typeof value.price === "number"
    && Number.isFinite(value.price)
    && typeof value.imageUrl === "string"
    && value.imageUrl.startsWith("/uploads/")
    && typeof value.createdAt === "string";
}
