import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as z from "zod";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  sort_order: z.number().default(0),
  image_url: z.string().nullable().optional(),
  banner_url: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  is_active: z.boolean().default(true),
  is_popular: z.boolean().default(false),
  is_new_collection: z.boolean().default(false),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(categories || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Staff access check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const STAFF_ROLES = ["super_admin", "admin", "store_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const body = await request.json();
    const parsedData = categorySchema.parse(body);

    const slug = `${parsedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}`;

    const { data: newCategory, error: insertError } = await supabase
      .from("categories")
      .insert({
        ...parsedData,
        slug,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Staff access check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const STAFF_ROLES = ["super_admin", "admin", "store_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    // Staff access check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const STAFF_ROLES = ["super_admin", "admin", "store_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const body = await request.json();
    const updateCategorySchema = categorySchema.extend({
      id: z.string().uuid(),
    });
    const parsedData = updateCategorySchema.parse(body);
    const { id, ...dataToUpdate } = parsedData;

    const slug = `${parsedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}`;

    const { data: updatedCategory, error: updateError } = await supabase
      .from("categories")
      .update({
        ...dataToUpdate,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

