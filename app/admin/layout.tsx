"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const STAFF_ROLES = [
  "super_admin",
  "admin",
  "store_manager",
  "inventory_manager",
  "marketing_manager",
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/auth/login");
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || !userProfile || !STAFF_ROLES.includes(userProfile.role)) {
          toast.error("Access forbidden: Staff credentials required.");
          router.push("/");
          return;
        }

        setProfile(userProfile);
      } catch (err: any) {
        toast.error("Authentication error.");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    await supabase.auth.signOut();
    toast.success("Successfully logged out.", { id: toastId });
    router.push("/auth/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: "bi-speedometer2" },
    { href: "/admin/products", label: "Products", icon: "bi-tag" },
    { href: "/admin/categories", label: "Categories", icon: "bi-folder2-open" },
    { href: "/admin/brands", label: "Brands", icon: "bi-award" },
    { href: "/admin/inventory", label: "Inventory", icon: "bi-box-seam" },
    { href: "/admin/orders", label: "Orders", icon: "bi-cart-check" },
    { href: "/admin/customers", label: "Customers", icon: "bi-people" },
    { href: "/admin/marketing", label: "Marketing", icon: "bi-percent" },
    { href: "/admin/cms", label: "Homepage CMS", icon: "bi-window-sidebar" },
    { href: "/admin/templates", label: "Templates", icon: "bi-palette" },
    { href: "/admin/combos", label: "Combos", icon: "bi-box" },
    { href: "/admin/reports", label: "Reports", icon: "bi-graph-up" },
    { href: "/admin/settings", label: "Settings", icon: "bi-gear" },
  ];

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary my-4" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary small">Authenticating Portal Access...</p>
      </div>
    );
  }

  return (
    <div className="d-flex min-vh-100 bg-light" style={{ fontFamily: "var(--font-body)" }}>
      {/* Sidebar Navigation (Desktop) */}
      <aside 
        className={`bg-white border-end border-light d-flex flex-column z-3 position-fixed top-0 start-0 admin-sidebar`}
        style={{
          width: "260px",
          height: "100vh",
          transition: "transform 0.3s ease-in-out",
          transform: mobileSidebarOpen ? "translateX(0)" : "translateX(-260px)"
        }}
      >
        {/* Brand Header */}
        <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center">
          <Link href="/" className="text-decoration-none d-flex align-items-center gap-2">
            <span className="bg-primary text-white d-flex align-items-center justify-content-center rounded-sm font-monospace fw-bold" style={{ width: "30px", height: "30px" }}>A</span>
            <span className="h6 fw-bold mb-0 text-dark tracking-wide">Aura.weaves</span>
          </Link>
          <button 
            className="btn btn-sm border-0 d-md-none p-1 text-secondary" 
            onClick={() => setMobileSidebarOpen(false)}
          >
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-grow-1 p-3 d-flex flex-column gap-2 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`d-flex align-items-center gap-3 px-3 py-3 rounded-md text-decoration-none transition-all ${
                  isActive 
                    ? "bg-primary text-white fw-bold shadow-sm" 
                    : "text-secondary hover-link"
                }`}
              >
                <i className={`bi ${link.icon} fs-5`}></i>
                <span className="small">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-top border-light d-flex flex-column gap-2">
          <Link 
            href="/" 
            className="btn btn-outline-secondary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 rounded-pill fs-8 fw-semibold"
          >
            <i className="bi bi-shop"></i>
            Storefront
          </Link>
          <button 
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 rounded-pill fs-8 fw-semibold"
          >
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Screen blocker overlay on mobile */}
      {mobileSidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 z-2 d-md-none"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="admin-main-content flex-grow-1 d-flex flex-column min-w-0">
        {/* Top Header */}
        <header className="bg-white border-bottom border-light py-3 px-4 d-flex justify-content-between align-items-center sticky-top">
          <div className="d-flex align-items-center gap-3">
            {/* Hamburger Trigger for Mobile */}
            <button 
              className="btn border-0 p-1 d-md-none text-dark" 
              onClick={() => setMobileSidebarOpen(true)}
            >
              <i className="bi bi-list fs-3"></i>
            </button>
            <div className="d-none d-sm-flex align-items-center bg-light px-3 py-2 rounded-pill border-light" style={{ width: "260px" }}>
              <i className="bi bi-search text-muted small me-2"></i>
              <input type="text" placeholder="Search order, SKU, etc." className="bg-transparent border-0 small w-100" style={{ outline: "none", fontSize: "0.8rem" }} />
            </div>
          </div>

          {/* User Details */}
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <h6 className="mb-0 fw-bold small text-dark">{profile?.full_name || "Staff Member"}</h6>
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle small font-monospace fs-9 text-uppercase" style={{ fontSize: "0.65rem" }}>
                {profile?.role?.replace("_", " ") || "Staff"}
              </span>
            </div>
            
            {/* Avatar circle */}
            <div className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle font-monospace fw-bold shadow-sm" style={{ width: "40px", height: "40px" }}>
              {profile?.full_name?.charAt(0).toUpperCase() || "S"}
            </div>
          </div>
        </header>

        {/* Page children container */}
        <main className="flex-grow-1 p-4">
          <div className="container-fluid p-0">
            {children}
          </div>
        </main>
      </div>

      {/* Responsive sidebar styles override for desktop */}
      <style jsx global>{`
        @media (min-width: 768px) {
          .admin-sidebar {
            transform: translate(0) !important;
          }
          .admin-main-content {
            margin-left: 260px !important;
          }
        }
      `}</style>
    </div>
  );
}
