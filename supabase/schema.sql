-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create roles type/check constraint mapping
-- Roles: 'super_admin', 'admin', 'store_manager', 'inventory_manager', 'marketing_manager', 'customer'

-- 1. Profiles Table (Linked to Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('super_admin', 'admin', 'store_manager', 'inventory_manager', 'marketing_manager', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (deleted_at is null);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Categories Table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_popular boolean not null default false,
  is_new_collection boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "Categories are viewable by everyone" on public.categories for select using (true);
create policy "Categories are manageable by staff" on public.categories for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager')
  )
);

-- 3. Brands Table
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brands enable row level security;
create policy "Brands are viewable by everyone" on public.brands for select using (true);
create policy "Brands are manageable by staff" on public.brands for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager')
  )
);

-- 4. Products Table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price >= price),
  cost_price numeric(12,2) check (cost_price >= 0),
  sku text unique,
  barcode text unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_trending boolean not null default false,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  meta_title text,
  meta_description text,
  meta_keywords text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.products enable row level security;
create policy "Active products are viewable by everyone" on public.products for select using (is_active = true and deleted_at is null);
create policy "All products are viewable by staff" on public.products for select using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'inventory_manager', 'marketing_manager')
  )
);
create policy "Products are manageable by admin and store/inventory managers" on public.products for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'inventory_manager')
  )
);

-- 5. Product Variants Table
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  barcode text unique,
  price numeric(12,2) check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price >= price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  attributes jsonb not null default '{}'::jsonb, -- e.g., {"color": "Champagne Gold", "fabric": "Banarasi Silk", "size": "6.5 Meters"}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_variants enable row level security;
create policy "Variants are viewable by everyone" on public.product_variants for select using (
  exists (select 1 from public.products where products.id = product_variants.product_id and products.is_active = true and products.deleted_at is null)
);
create policy "Variants are manageable by staff" on public.product_variants for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'inventory_manager')
  )
);

-- 6. Product Images Table
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;
create policy "Images are viewable by everyone" on public.product_images for select using (true);
create policy "Images are manageable by staff" on public.product_images for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'inventory_manager')
  )
);

-- 7. Product Videos Table
create table public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  video_url text not null,
  thumbnail_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_videos enable row level security;
create policy "Videos are viewable by everyone" on public.product_videos for select using (true);
create policy "Videos are manageable by staff" on public.product_videos for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'inventory_manager')
  )
);

-- 8. Coupons Table
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) default 0.00 check (min_order_amount >= 0),
  max_discount_amount numeric(12,2) check (max_discount_amount >= 0),
  starts_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > starts_at),
  usage_limit integer check (usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
create policy "Active coupons are viewable by customers" on public.coupons for select using (is_active = true and starts_at <= now() and expires_at >= now());
create policy "Coupons are manageable by staff" on public.coupons for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'marketing_manager')
  )
);

-- 9. Addresses Table
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  phone text not null,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addresses enable row level security;
create policy "Users can manage their own addresses" on public.addresses for all using (auth.uid() = user_id);
create policy "Staff can view user addresses" on public.addresses for select using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager')
  )
);

-- 10. Orders Table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  order_number text not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  subtotal_amount numeric(12,2) not null check (subtotal_amount >= 0),
  discount_amount numeric(12,2) not null default 0.00 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0.00 check (tax_amount >= 0),
  shipping_amount numeric(12,2) not null default 0.00 check (shipping_amount >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text not null default 'cod' check (payment_method in ('cod', 'razorpay')),
  billing_address_id uuid references public.addresses(id) on delete set null,
  shipping_address_id uuid references public.addresses(id) on delete set null,
  tracking_number text,
  shipping_carrier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
create policy "Users can view their own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Staff can manage all orders" on public.orders for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'inventory_manager')
  )
);

-- 11. Order Items Table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price numeric(12,2) not null check (price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;
create policy "Users can view their own order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Staff can view all order items" on public.order_items for select using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager')
  )
);

-- 12. Wishlists Table
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.wishlists enable row level security;
create policy "Users can manage their own wishlist" on public.wishlists for all using (auth.uid() = user_id);

-- 13. Reviews Table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  title text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
create policy "Approved reviews are viewable by everyone" on public.reviews for select using (is_approved = true);
create policy "Users can manage their own reviews" on public.reviews for all using (auth.uid() = user_id);
create policy "Staff can manage all reviews" on public.reviews for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'marketing_manager')
  )
);

-- 14. Settings Table
create table public.settings (
  key text primary key,
  value text not null,
  "group" text not null, -- 'website', 'payment', 'shipping', 'tax', 'email'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;
create policy "Settings are viewable by everyone" on public.settings for select using (true);
create policy "Settings are manageable by admin" on public.settings for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin')
  )
);

-- 15. Inventory Transactions Table
create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity integer not null,
  reference_id uuid, -- e.g. order_id, manual adjustment_id
  notes text,
  created_at timestamptz not null default now()
);

alter table public.inventory_transactions enable row level security;
create policy "Transactions are viewable and manageable by inventory staff" on public.inventory_transactions for all using (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('super_admin', 'admin', 'store_manager', 'inventory_manager')
  )
);

-- Create trigger function to automatically create profile on user signup in Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance optimization
create index idx_products_category on public.products(category_id);
create index idx_products_subcategory on public.products(subcategory_id);
create index idx_products_brand on public.products(brand_id);
create index idx_product_variants_product on public.product_variants(product_id);
create index idx_orders_user on public.orders(user_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_addresses_user on public.addresses(user_id);
create index idx_reviews_product on public.reviews(product_id);
create index idx_wishlists_user on public.wishlists(user_id);
