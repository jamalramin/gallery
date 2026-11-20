import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type GalleryItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
const galleryFile = path.join(dataDirectory, "gallery.json");
let writeQueue: Promise<void> = Promise.resolve();
let sqlClient: NeonQueryFunction<false, false> | undefined;

export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (getStorageMode() === "hosted") {
    const rows = await getDatabase()`
      SELECT id, name, price::float8 AS price,
        image_url AS "imageUrl", created_at::text AS "createdAt"
      FROM gallery_items
      ORDER BY created_at DESC, id DESC
    `;
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      price: Number(row.price),
      imageUrl: String(row.imageUrl),
      createdAt: String(row.createdAt),
    }));
  }

  try {
    const contents = await readFile(galleryFile, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!Array.isArray(parsed)) {
      throw new Error("Gallery data must be a JSON array.");
    }
    const items: GalleryItem[] = [];
    for (const value of parsed) {
      if (!isGalleryItem(value)) {
        throw new Error("Gallery data contains an invalid item.");
      }
      items.push(value);
    }
    return items;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function isGalleryItem(value: unknown): value is GalleryItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return typeof item.id === "string"
    && typeof item.name === "string"
    && typeof item.price === "number"
    && Number.isFinite(item.price)
    && typeof item.imageUrl === "string"
    && item.imageUrl.startsWith("/uploads/")
    && typeof item.createdAt === "string";
}

export async function addGalleryItem(
  name: string,
  price: number,
  image: File,
  extension: string,
  contentType: string,
): Promise<GalleryItem> {
  if (getStorageMode() === "hosted") {
    return addHostedGalleryItem(name, price, image, extension, contentType);
  }

  const operation = writeQueue.then(async () => {
    await mkdir(uploadsDirectory, { recursive: true });
    await mkdir(dataDirectory, { recursive: true });

    const id = randomUUID();
    const imageName = `${id}.${extension}`;
    const imagePath = path.join(uploadsDirectory, imageName);
    const item: GalleryItem = {
      id,
      name,
      price,
      imageUrl: `/uploads/${imageName}`,
      createdAt: new Date().toISOString(),
    };

    await writeFile(imagePath, new Uint8Array(await image.arrayBuffer()), { flag: "wx" });
    try {
      const items = await getGalleryItems();
      const temporaryFile = path.join(dataDirectory, `${id}.tmp`);
      await writeFile(temporaryFile, JSON.stringify([item, ...items], null, 2));
      await rename(temporaryFile, galleryFile);
    } catch (error) {
      await rm(imagePath, { force: true });
      throw error;
    }

    return item;
  });

  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function addHostedGalleryItem(
  name: string,
  price: number,
  image: File,
  extension: string,
  contentType: string,
): Promise<GalleryItem> {
  const id = randomUUID();
  const blob = await put(`gallery/${id}.${extension}`, image, {
    access: "public",
    addRandomSuffix: false,
    contentType,
  });

  try {
    const rows = await getDatabase()`
      INSERT INTO gallery_items (id, name, price, image_url)
      VALUES (${id}, ${name}, ${price}, ${blob.url})
      RETURNING id, name, price::float8 AS price,
        image_url AS "imageUrl", created_at::text AS "createdAt"
    `;
    const row = rows[0];
    if (!row) {
      throw new Error("The gallery item was not returned after insert.");
    }
    return {
      id: String(row.id),
      name: String(row.name),
      price: Number(row.price),
      imageUrl: String(row.imageUrl),
      createdAt: String(row.createdAt),
    };
  } catch (error) {
    try {
      await del(blob.url);
    } catch (cleanupError) {
      console.error("Could not remove the uploaded image after a database error:", cleanupError);
    }
    throw error;
  }
}

function getStorageMode(): "local" | "hosted" {
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const hasBlobCredentials = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN
    || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );

  if (hasDatabase && hasBlobCredentials) {
    return "hosted";
  }
  if (!hasDatabase && !hasBlobCredentials && process.env.VERCEL !== "1") {
    return "local";
  }
  throw new Error(
    "Configure both DATABASE_URL and Vercel Blob credentials (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID with VERCEL_OIDC_TOKEN).",
  );
}

function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!sqlClient) {
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
