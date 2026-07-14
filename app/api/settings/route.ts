import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: settings, error } = await supabase
      .from("settings")
      .select("*");

    if (error) {
      throw error;
    }

    // Organize settings into group-based objects
    const groupedSettings = settings?.reduce((acc: any, item) => {
      if (!acc[item.group]) {
        acc[item.group] = {};
      }
      acc[item.group][item.key] = item.value;
      return acc;
    }, {}) || {};

    return NextResponse.json(groupedSettings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate and check if the user belongs to staff
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
    const { settingsList } = body; // Array of { key: string, value: string, group: string }

    if (!Array.isArray(settingsList)) {
      return NextResponse.json({ error: "settingsList must be an array" }, { status: 400 });
    }

    // Upsert list of settings rows
    const { data: upserted, error: upsertError } = await supabase
      .from("settings")
      .upsert(
        settingsList.map((item) => ({
          key: item.key,
          value: item.value,
          group: item.group,
          updated_at: new Date().toISOString(),
        }))
      )
      .select();

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json(upserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
