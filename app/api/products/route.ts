import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as z from "zod";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  price: z.number().min(0, "Price must be positive"),
  compare_at_price: z.number().optional(),
  cost_price: z.number().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  stock_quantity: z.number().min(0).default(0),
  low_stock_threshold: z.number().min(0).default(10),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  category_id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  images: z.array(z.object({
    image_url: z.string().url("Please enter a valid image URL"),
    is_main: z.boolean().default(false)
  })).max(4, "Maximum 4 images allowed").optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let query = supabase
      .from("products")
      .select(`
        *,
        categories:categories!category_id (id, name),
        brands (id, name),
        product_images (*)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(products || []);
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

    const STAFF_ROLES = ["super_admin", "admin", "store_manager", "inventory_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const body = await request.json();
    const parsedData = productSchema.parse(body);
    const { images, ...productData } = parsedData;

    // Generate unique slug from product name + random suffix
    const slug = `${parsedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert({
        ...productData,
        slug,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Insert images if present
    if (images && images.length > 0) {
      const imagesToInsert = images.map((img: any, idx: number) => ({
        product_id: newProduct.id,
        image_url: img.image_url,
        sort_order: img.is_main ? 0 : idx + 1,
      }));
      const { error: imgError } = await supabase
        .from("product_images")
        .insert(imagesToInsert);
      if (imgError) throw imgError;
    }

    return NextResponse.json(newProduct, { status: 201 });
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
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
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

    const STAFF_ROLES = ["super_admin", "admin", "store_manager", "inventory_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    // Perform soft-delete by setting deleted_at timestamp
    const { data: softDeletedProduct, error: deleteError } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: "Product soft-deleted successfully", product: softDeletedProduct });
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

    const STAFF_ROLES = ["super_admin", "admin", "store_manager", "inventory_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const body = await request.json();
    const updateProductSchema = productSchema.extend({
      id: z.string().uuid(),
    });
    const parsedData = updateProductSchema.parse(body);
    const { id, images, ...dataToUpdate } = parsedData;

    // Generate unique slug from product name + random suffix
    const slug = `${parsedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        ...dataToUpdate,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Delete old images
    const { error: deleteImgError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);
    if (deleteImgError) throw deleteImgError;

    // Insert new images
    if (images && images.length > 0) {
      const imagesToInsert = images.map((img: any, idx: number) => ({
        product_id: id,
        image_url: img.image_url,
        sort_order: img.is_main ? 0 : idx + 1,
      }));
      const { error: insertImgError } = await supabase
        .from("product_images")
        .insert(imagesToInsert);
      if (insertImgError) throw insertImgError;
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

