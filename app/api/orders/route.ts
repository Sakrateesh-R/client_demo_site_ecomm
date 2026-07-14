import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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

    const STAFF_ROLES = ["super_admin", "admin", "store_manager", "inventory_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles (email, full_name),
        billing_address:addresses!orders_billing_address_id_fkey (*),
        shipping_address:addresses!orders_shipping_address_id_fkey (*)
      `)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json(orders || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      customer_name,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      items,
      subtotal,
      shipping,
      discount,
      total,
      payment_method,
    } = body;

    if (!customer_name || !email || !phone || !address_line1 || !city || !state || !postal_code || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required shipping or items field data" }, { status: 400 });
    }

    // 1. Insert address
    const { data: address, error: addressError } = await adminSupabase
      .from("addresses")
      .insert({
        user_id: user?.id || null,
        address_line1,
        address_line2: address_line2 || "",
        city,
        state,
        postal_code,
        country: country || "India",
        phone,
      })
      .select()
      .single();

    if (addressError) throw addressError;

    // 2. Insert order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        user_id: user?.id || null,
        order_number: orderNumber,
        status: "pending",
        total_amount: Number(total),
        subtotal_amount: Number(subtotal),
        discount_amount: Number(discount || 0),
        shipping_amount: Number(shipping || 0),
        payment_status: "pending",
        payment_method: payment_method || "cod",
        billing_address_id: address.id,
        shipping_address_id: address.id,
        notes: `Customer Phone: ${phone}. Email: ${email}. Name: ${customer_name}.`,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Insert order items
    const orderItemsPayload = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      price: Number(item.price),
      total_price: Number(item.price * item.quantity),
    }));

    const { error: itemsError } = await adminSupabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) throw itemsError;

    // 4. Sync inventory levels
    for (const item of items) {
      try {
        const { data: prod } = await adminSupabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single();

        if (prod) {
          const parsed = JSON.parse(prod.meta_keywords || "{}");
          if (parsed.inventory_type === "variant") {
            if (item.size_letter) {
              parsed.letters_inventory = (parsed.letters_inventory || []).map((i: any) =>
                i.size === item.size_letter ? { ...i, quantity: Math.max(0, i.quantity - item.quantity) } : i
              );
            }
            if (item.size_inch) {
              parsed.inches_inventory = (parsed.inches_inventory || []).map((i: any) =>
                i.size === item.size_inch ? { ...i, quantity: Math.max(0, i.quantity - item.quantity) } : i
              );
            }
            const totalStock = (parsed.letters_inventory || []).reduce((sum: number, curr: any) => sum + curr.quantity, 0) +
                               (parsed.inches_inventory || []).reduce((sum: number, curr: any) => sum + curr.quantity, 0);

            await adminSupabase
              .from("products")
              .update({
                meta_keywords: JSON.stringify(parsed),
                stock_quantity: totalStock,
              })
              .eq("id", item.product_id);
          } else {
            await adminSupabase
              .from("products")
              .update({
                stock_quantity: Math.max(0, prod.stock_quantity - item.quantity),
              })
              .eq("id", item.product_id);
          }
        }
      } catch (err) {
        console.error("Error decrementing stock for item:", item, err);
      }
    }

    return NextResponse.json({ success: true, orderNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const STAFF_ROLES = ["super_admin", "admin", "store_manager", "inventory_manager"];
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, tracking_number, shipping_carrier, payment_status } = body;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (status) updateData.status = status;
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
    if (shipping_carrier !== undefined) updateData.shipping_carrier = shipping_carrier;
    if (payment_status) updateData.payment_status = payment_status;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
