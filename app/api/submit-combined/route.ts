import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/app/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { uploadPdfToS3 } from "@/app/lib/s3";

export async function POST(req: NextRequest) {
  try {
    // Get user ID from Clerk JWT
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;

    if (!file || !slug) {
      return NextResponse.json({ error: "Missing file or slug" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (!/^[-a-zA-Z0-9_]+$/.test(slug)) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
    }

    // Upload to S3
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileUrl = await uploadPdfToS3(buffer, file.name);

    // Save to database
    const supabase = await createClerkSupabaseClient(req);
    const { data, error } = await supabase
      .from("pdf_slugs")
      .insert([{ slug, pdf: fileUrl, user_id: userId }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Combined upload error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
} 