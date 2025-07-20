import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
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

    // Use service role key to bypass RLS policies for slug checking
    // This is safe since we're only checking slug existence (public read operation)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if slug exists anywhere in the database
    const { data: existingSlug, error, count } = await supabase
      .from("pdf_slugs")
      .select("slug", { count: 'exact' })
      .eq("slug", slug);

    if (error) {
      console.error("Database error checking slug:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const isAvailable = !existingSlug || existingSlug.length === 0;

    return NextResponse.json({ 
      available: isAvailable,
      slug: slug
    }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in check-slug:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}