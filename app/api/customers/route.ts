import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // List all users
    const { data: customers, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(customers || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const STAFF_ROLES = ["super_admin", "admin"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const body = await request.json();
    const { id, isBlocked } = body; // isBlocked = boolean

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const { data: updatedCustomer, error: updateError } = await supabase
      .from("profiles")
      .update({
        deleted_at: isBlocked ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
