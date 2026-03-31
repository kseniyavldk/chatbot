import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ok, badRequest, serverError } from "@/lib/api-helpers";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);
const db = supabaseAdmin as any;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return badRequest("file is required");
    if (file.size > MAX_SIZE) return badRequest("File too large (max 10MB)");
    if (!ALLOWED.has(file.type))
      return badRequest(`Unsupported type: ${file.type}`);

    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("attachments")
      .upload(storagePath, buffer, { contentType: file.type });
    if (uploadError) throw uploadError;

    let extractedText: string | null = null;

    if (file.type === "text/plain" || file.type === "text/markdown") {
      extractedText = buffer.toString("utf-8").slice(0, 100_000);
    } else if (file.type === "application/pdf") {
      try {
        const pdfParse = (await import("pdf-parse")) as any;
        const result = await pdfParse(buffer);
        extractedText = result.text.slice(0, 100_000);
      } catch {}
    }

    const { data: attachment, error: dbError } = await db
      .from("attachments")
      .insert({
        message_id: null,
        type: file.type.startsWith("image/") ? "image" : "document",
        storage_path: storagePath,
        filename: file.name,
        mime_type: file.type,
        extracted_text: extractedText,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return ok({ attachment });
  } catch (err) {
    return serverError(err);
  }
}
