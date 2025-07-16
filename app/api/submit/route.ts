import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/app/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, pdf } = body;
  if (!slug || !pdf) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get user ID from Clerk JWT
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClerkSupabaseClient(req);
  const { data, error } = await supabase
    .from("pdf_slugs")
    .insert([{ slug, pdf, user_id: userId }])
    .select();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
}
          