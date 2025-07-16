import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/app/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // Get user ID from Clerk JWT
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient(req);
    
    const { data: slugs, error } = await supabase
      .from("pdf_slugs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching slugs:", error);
      return NextResponse.json({ error: "Failed to fetch PDF slugs" }, { status: 500 });
    }

    return NextResponse.json({ slugs }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 