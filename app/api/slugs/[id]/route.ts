import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/app/lib/db";
import { getAuth } from "@clerk/nextjs/server";

// DELETE /api/slugs/[id] - Delete a PDF slug
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClerkSupabaseClient(req);
    
    // First, verify the slug belongs to the user
    const { data: existingSlug, error: fetchError } = await supabase
      .from("pdf_slugs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingSlug) {
      return NextResponse.json({ error: "PDF slug not found" }, { status: 404 });
    }

    if (existingSlug.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this slug" }, { status: 403 });
    }

    // Delete the slug
    const { error: deleteError } = await supabase
      .from("pdf_slugs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting slug:", deleteError);
      return NextResponse.json({ error: "Failed to delete PDF slug" }, { status: 500 });
    }

    return NextResponse.json({ message: "PDF slug deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/slugs/[id] - Update a PDF slug name
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { slug: newSlug } = body;

    if (!newSlug || !/^[-a-zA-Z0-9_]+$/.test(newSlug)) {
      return NextResponse.json({ 
        error: "Invalid slug format. Use only letters, numbers, dashes, and underscores." 
      }, { status: 400 });
    }

    const supabase = await createClerkSupabaseClient(req);
    
    // First, verify the slug belongs to the user
    const { data: existingSlug, error: fetchError } = await supabase
      .from("pdf_slugs")
      .select("user_id, slug")
      .eq("id", id)
      .single();

    if (fetchError || !existingSlug) {
      return NextResponse.json({ error: "PDF slug not found" }, { status: 404 });
    }

    if (existingSlug.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized to update this slug" }, { status: 403 });
    }

    // Check if new slug is already taken (by someone else)
    const { data: duplicateSlug } = await supabase
      .from("pdf_slugs")
      .select("id")
      .eq("slug", newSlug)
      .neq("id", id)
      .single();

    if (duplicateSlug) {
      return NextResponse.json({ 
        error: `The slug "${newSlug}" is already taken. Please choose a different name.` 
      }, { status: 409 });
    }

    // Update the slug
    const { data, error: updateError } = await supabase
      .from("pdf_slugs")
      .update({ 
        slug: newSlug,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating slug:", updateError);
      return NextResponse.json({ error: "Failed to update PDF slug" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 