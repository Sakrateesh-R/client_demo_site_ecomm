import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as z from "zod";

const couponSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  discount_type: z.enum(["fixed", "percentage"]),
  discount_value: z.number().min(0, "Value must be positive"),
  min_order_amount: z.number().min(0).default(0),
  starts_at: z.string().default(() => new Date().toISOString()),
  expires_at: z.string().min(1, "Expiration date is required"),
  usage_limit: z.number().min(0).optional().nullable(),
  is_active: z.boolean().default(true),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: coupons, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(coupons || []);
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
    const parsedData = couponSchema.parse(body);

    const { data: newCoupon, error: insertError } = await supabase
      .from("coupons")
      .insert(parsedData)
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(newCoupon, { status: 201 });
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
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
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
      .from("coupons")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    return NextResponse.json({ message: "Coupon deleted successfully" });
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
    const updateCouponSchema = couponSchema.extend({
      id: z.string().uuid(),
    });
    const parsedData = updateCouponSchema.parse(body);
    const { id, ...dataToUpdate } = parsedData;

    const { data: updatedCoupon, error: updateError } = await supabase
      .from("coupons")
      .update({
        ...dataToUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json(updatedCoupon);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

