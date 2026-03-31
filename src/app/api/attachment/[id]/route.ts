import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notFound, serverError } from "@/lib/api-helpers";
import { Database } from "@/types/supabase";

type AttachmentRow = Pick<
  Database["public"]["Tables"]["attachments"]["Row"],
  "storage_path" | "mime_type" | "filename"
>;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: att, error } = await supabaseAdmin
      .from("attachments")
      .select("storage_path, mime_type, filename")
      .eq("id", id)
      .single<AttachmentRow>();

    if (error || !att) return notFound();

    const { data, error: downloadError } = await supabaseAdmin.storage
      .from("attachments")
      .download(att.storage_path);

    if (downloadError || !data) return notFound();

    return new Response(await data.arrayBuffer(), {
      headers: {
        "Content-Type": att.mime_type,
        "Content-Disposition": `inline; filename="${att.filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
