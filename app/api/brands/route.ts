import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as z from "zod";

const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  logo_url: z.string().optional(),
  description: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return NextResponse.json(brands || []);
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
    const parsedData = brandSchema.parse(body);

    const slug = `${parsedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}`;

    const { data: newBrand, error: insertError } = await supabase
      .from("brands")
      .insert({
        ...parsedData,
        slug,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(newBrand, { status: 201 });
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
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
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
      .from("brands")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    return NextResponse.json({ message: "Brand deleted successfully" });
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
    const updateBrandSchema = brandSchema.extend({
      id: z.string().uuid(),
    });
    const parsedData = updateBrandSchema.parse(body);
    const { id, ...dataToUpdate } = parsedData;

    const slug = `${parsedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}`;

    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({
        ...dataToUpdate,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json(updatedBrand);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

