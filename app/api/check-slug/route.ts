import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/app/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  // Check authentication
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug parameter required" }, { status: 400 });
  }

  if (!/^[-a-zA-Z0-9_]+$/.test(slug)) {
    return NextResponse.json({ 
      available: false, 
      error: "Invalid slug format" 
    }, { status: 200 });
  }

  const supabase = await createClerkSupabaseClient(req);
  
  const { data: existingSlug, error } = await supabase
    .from("pdf_slugs")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (which is what we want)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ 
    available: !existingSlug,
    slug: slug 
  }, { status: 200 });
} 