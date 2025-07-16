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
  
  // First, check if slug already exists
  const { data: existingSlug } = await supabase
    .from("pdf_slugs")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (existingSlug) {
    return NextResponse.json({ 
      error: `The slug "${slug}" is already taken. Please choose a different name.` 
    }, { status: 409 }); // 409 Conflict
  }

  // Insert the new record
  const { data, error } = await supabase
    .from("pdf_slugs")
    .insert([{ slug, pdf, user_id: userId }])
    .select();
    
  if (error) {
    // Handle unique constraint violation as backup
    if (error.code === '23505') { // PostgreSQL unique violation error code
      return NextResponse.json({ 
        error: `The slug "${slug}" is already taken. Please choose a different name.` 
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
}
          