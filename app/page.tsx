import React from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let cmsConfigs: any = {};
  let dbCategories: any[] = [];
  let dbNewCollections: any[] = [];
  let dbProducts: any[] = [];

  try {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("group", "cms");

    cmsConfigs = settings?.reduce((acc: any, item) => {
      if (item.key === "hero_banners_json") {
        try {
          acc[item.key] = JSON.parse(item.value);
        } catch {
          acc[item.key] = null;
        }
      } else if (item.key === "active_theme" || item.key === "free_shipping_threshold") {
        acc[item.key] = item.value;
      } else {
        acc[item.key] = item.value === "true";
      }
      return acc;
    }, {}) || {};

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("is_popular", true)
      .order("sort_order", { ascending: true });
    dbCategories = categoriesData || [];

    const { data: newCollectionsData } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("is_new_collection", true)
      .order("sort_order", { ascending: true });
    dbNewCollections = newCollectionsData || [];

    const { data: productsData } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    dbProducts = productsData || [];
  } catch (err) {
    // Fallback if settings table hasn't been query-initialized yet
    cmsConfigs = {
      show_hero_section: true,
      show_categories_section: true,
      show_collections_section: true,
      show_seasonal_section: true,
      show_offers_section: true,
      show_why_choose_us_section: true,
      show_testimonial_section: true,
      show_instagram_section: true,
    };
  }

  const seasonalPicks = dbProducts.filter((p) => p.is_featured);
  const displaySeasonal = seasonalPicks.length > 0 ? seasonalPicks.slice(0, 4) : dbProducts.slice(0, 4);

  const offerProducts = dbProducts.filter((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price));
  const displayOffers = offerProducts.length > 0 ? offerProducts.slice(0, 4) : dbProducts.filter(p => p.is_trending).slice(0, 4);

  // Filter out categories that do not have any active products
  const categoryIdsWithProducts = new Set(dbProducts.map((p) => p.category_id).filter(Boolean));
  const activeCategories = dbCategories.filter((c) => categoryIdsWithProducts.has(c.id));
  const activeNewCollections = dbNewCollections.filter((c) => categoryIdsWithProducts.has(c.id));

  const defaultBanners = [
    {
      id: "card-1",
      title: "Royal Banarasi Silk",
      subtitle: "Saree Collection",
      image_url: "/images/hero-silk.png",
      redirection_url: "#seasonal-picks",
      bg_color: "#2b568c",
      is_double_width: true,
    },
    {
      id: "card-2",
      title: "Artisan Pashmina",
      subtitle: "Fine Cashmere",
      image_url: "/images/hero-cashmere.png",
      redirection_url: "#seasonal-picks",
      bg_color: "#cf6752",
      is_double_width: false,
    },
    {
      id: "card-3",
      title: "Organic Weaves",
      subtitle: "Linens",
      image_url: "/images/hero-linen.png",
      redirection_url: "#seasonal-picks",
      bg_color: "#e8c973",
      is_double_width: false,
    },
  ];
  const heroBanners = cmsConfigs.hero_banners_json || defaultBanners;

  // Ensure sections default to true if not explicitly set in the database setting keys
  const showHero = cmsConfigs.show_hero_section !== false;
  const showCategories = cmsConfigs.show_categories_section !== false;
  const showCollections = cmsConfigs.show_collections_section !== false;
  const showSeasonal = cmsConfigs.show_seasonal_section !== false;
  const showOffers = cmsConfigs.show_offers_section !== false;
  const showWhyChooseUs = cmsConfigs.show_why_choose_us_section !== false;
  const showTestimonial = cmsConfigs.show_testimonial_section !== false;
  const showInstagram = cmsConfigs.show_instagram_section !== false;

  const activeTheme = cmsConfigs.active_theme || "theme-classic";

  // Hero Layout Renderer
  const renderHero = () => {
    if (!showHero) return null;
    
    if (activeTheme === "theme-emerald") {
      return (
        <section className="position-relative overflow-hidden py-0" style={{ minHeight: "75vh" }}>
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark z-0">
            <img 
              src={heroBanners[0]?.image_url || "/images/hero-silk.png"} 
              alt="Atelier Banner" 
              className="w-100 h-100 object-fit-cover opacity-25" 
            />
          </div>
          <div className="position-relative container h-100 d-flex flex-column justify-content-center align-items-center text-center py-5 z-1" style={{ minHeight: "75vh" }}>
            <span className="text-uppercase tracking-widest text-accent small fw-bold mb-3">Atelier Collections</span>
            <h1 className="display-3 fw-bold text-white mb-4 animate-fade-in" style={{ fontFamily: "var(--font-heading)" }}>
              Curated Premium Handloom Weaves
            </h1>
            <p className="text-light opacity-75 small mb-5 hero-description animate-fade-in" style={{ maxWidth: "560px", lineHeight: "1.8" }}>
              Experience the finest hand-woven threads, organic linens, and fine cashmere selected for contemporary elegance.
            </p>
            <a href="#seasonal-picks" className="btn btn-wix-primary rounded-pill px-5 py-3 fw-bold text-uppercase tracking-wider animate-fade-in">
              Explore Collection
            </a>
          </div>
        </section>
      );
    }

    if (activeTheme === "theme-crimson") {
      return (
        <section className="py-0 overflow-hidden bg-light border-bottom border-light">
          <div className="row g-0">
            <div className="col-12 col-lg-6 d-flex flex-column justify-content-center p-5 text-white" style={{ backgroundColor: "var(--color-primary)", minHeight: "450px" }}>
              <div className="p-lg-4 animate-fade-in">
                <span className="text-uppercase tracking-wider text-accent small fw-bold mb-2 d-block">Heritage Chronicles</span>
                <h1 className="display-4 fw-bold mb-4 text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  Woven Stories of Weaver Artisans
                </h1>
                <p className="text-white opacity-75 small mb-5 hero-description" style={{ lineHeight: "1.8" }}>
                  Direct handloom collaborations bringing pure golden zari silk sarees and traditional cashmere designs to your wardrobe.
                </p>
                <div>
                  <a href="#seasonal-picks" className="btn btn-wix-outline rounded-pill px-5 py-2.5 text-white border-white">
                    View Catalog
                  </a>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6 position-relative" style={{ minHeight: "450px" }}>
              <img 
                src={heroBanners[1]?.image_url || "/images/hero-cashmere.png"} 
                alt="Brocade visual"
                className="w-100 h-100 object-fit-cover position-absolute top-0 start-0 animate-fade-in" 
              />
            </div>
          </div>
        </section>
      );
    }

    // Classic default hero
    return (
      <section className="py-5 overflow-hidden dot-grid-bg">
        <div className="container-fluid px-lg-5 position-relative z-1 animate-fade-in">
          <div className="row align-items-center mb-5">
            <div className="col-12 col-lg-6 mb-4 mb-lg-0">
              <h2 className="display-4 fw-bold mb-3 text-dark text-capitalize" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-1px" }}>
                You Can Feel <br />
                <span className="text-accent" style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: "400" }}>Textile</span> Sense.
              </h2>
            </div>
            <div className="col-12 col-lg-6 d-md-flex align-items-center justify-content-lg-end gap-4">
              <p className="text-secondary small mb-3 mb-md-0 mx-lg-3 hero-description" style={{ maxWidth: "340px", lineHeight: "1.6" }}>
                Aura.weaves is the right place for you to acquire premium artisan textile fabrics with heritage craftsmanship, reasonable pricing, and absolute trust.
              </p>
              <div className="d-flex gap-2">
                <a href="#best-offers" className="btn btn-wix-primary text-nowrap text-decoration-none">
                  Shop Now
                </a>
                <a href="#why-choose-us" className="btn btn-wix-outline text-nowrap text-decoration-none">
                  Learn More
                </a>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-2">
            {heroBanners.map((banner: any, idx: number) => {
              const widthClass = banner.is_double_width ? "col-12 col-md-6" : "col-12 col-sm-6 col-md-3";
              return (
                <div key={banner.id || idx} className={`${widthClass} animate-fade-in`}>
                  <a href={banner.redirection_url || "#"} className="text-decoration-none">
                    <div className="wix-hero-card position-relative overflow-hidden" style={{ backgroundColor: banner.bg_color || "#2b568c" }}>
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                      />
                      <div className="position-absolute bottom-0 start-0 w-100 p-4 bg-gradient-to-t text-white" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))", zIndex: 1 }}>
                        <span className="text-uppercase small tracking-widest text-light opacity-75">{banner.subtitle}</span>
                        <h4 className="h5 fw-bold mb-0">{banner.title}</h4>
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // Categories Layout Renderer
  const renderCategories = () => {
    if (!showCategories) return null;

    if (activeTheme === "theme-emerald") {
      return (
        <section id="popular-categories" className="py-5 bg-white border-bottom border-light">
          <div className="container py-4">
            <div className="text-center mb-5">
              <span className="text-uppercase tracking-widest text-secondary small fw-bold d-block mb-1">Atelier Departments</span>
              <h3 className="h3 fw-bold mb-0 text-dark" style={{ fontFamily: "var(--font-heading)" }}>Shop By Category</h3>
            </div>
            <div className="row g-4 justify-content-center">
              {activeCategories.map((c) => (
                <div key={c.id} className="col-12 col-md-4">
                  <Link href={`/category/${c.slug}`} className="text-decoration-none">
                    <div className="card border-0 rounded-4 overflow-hidden shadow-sm bg-light text-center p-4 hover-shadow" style={{ transition: "all 0.3s" }}>
                      <div className="rounded-circle overflow-hidden mx-auto mb-3 border border-light" style={{ width: "100px", height: "100px" }}>
                        <img src={c.image_url || "/images/hero-silk.png"} alt={c.name} className="w-100 h-100 object-fit-cover" />
                      </div>
                      <h5 className="fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>{c.name}</h5>
                      <p className="text-secondary small mb-3 text-truncate" style={{ fontSize: "0.8rem" }}>{c.description || "Discover premium weaves and heritage patterns."}</p>
                      <span className="text-primary small fw-semibold">View Catalog <i className="bi bi-chevron-right fs-9"></i></span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activeTheme === "theme-crimson") {
      return (
        <section id="popular-categories" className="py-5 bg-white border-bottom border-light">
          <div className="container py-4">
            <div className="mb-5 text-center">
              <h3 className="h3 fw-bold text-dark mb-0" style={{ fontFamily: "var(--font-heading)" }}>The Loom Divisions</h3>
              <p className="text-secondary small mb-0">Handpicked traditional collections direct from active artisan hubs.</p>
            </div>
            <div className="row g-3 justify-content-center">
              {activeCategories.map((c, idx) => (
                <div key={c.id} className="col-6 col-lg-3">
                  <Link href={`/category/${c.slug}`} className="text-decoration-none">
                    <div className="position-relative rounded-4 overflow-hidden shadow-sm" style={{ height: "240px" }}>
                      <img src={c.image_url || "/images/hero-silk.png"} alt={c.name} className="w-100 h-100 object-fit-cover position-absolute top-0 start-0" />
                      <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "linear-gradient(to top, rgba(24,15,20,0.85), transparent)" }} />
                      <div className="position-absolute bottom-0 start-0 p-3 text-white">
                        <span className="fs-9 text-accent text-uppercase font-monospace d-block mb-1">0{idx + 1}</span>
                        <h5 className="fw-bold mb-0 text-white" style={{ fontFamily: "var(--font-heading)" }}>{c.name}</h5>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // Classic oval default layout
    return (
      <section id="popular-categories" className="py-5 bg-white">
        <div className="container py-4">
          <h3 className="h4 text-center fw-bold mb-5 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
            Popular categories
          </h3>
          
          <div className="row g-4 justify-content-center category-row">
            {activeCategories.length > 0 ? (
              activeCategories.map((c) => (
                <div key={c.id} className="col-4 col-md-2 text-center category-col">
                  <Link href={`/category/${c.slug}`} className="category-oval-card text-decoration-none">
                    <div className="category-oval-image">
                      <img 
                        src={c.image_url || "/images/hero-silk.png"} 
                        alt={c.name} 
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <span className="category-oval-title">{c.name}</span>
                  </Link>
                </div>
              ))
            ) : (
              <>
                {["Sarees", "Cashmere", "Linen", "Bespoke", "Bridal", "Heritage"].map((name, i) => (
                  <div key={i} className="col-4 col-md-2 text-center category-col">
                    <a href="#seasonal-picks" className="category-oval-card">
                      <div className="category-oval-image">
                        <img src={i % 2 === 0 ? "/images/hero-silk.png" : "/images/hero-cashmere.png"} alt={name} />
                      </div>
                      <span className="category-oval-title">{name}</span>
                    </a>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
    );
  };

  // Seasonal Picks Layout Renderer
  const renderSeasonalPicks = () => {
    if (!showSeasonal) return null;

    if (activeTheme === "theme-emerald") {
      return (
        <section id="seasonal-picks" className="py-5 bg-white border-bottom border-light">
          <div className="container py-4">
            <div className="text-center mb-5">
              <span className="text-uppercase tracking-widest text-secondary small fw-bold d-block mb-1">Lookbook Highlights</span>
              <h3 className="h3 fw-bold mb-0 text-dark" style={{ fontFamily: "var(--font-heading)" }}>Featured Collection</h3>
            </div>
            <div className="row g-4">
              {displaySeasonal.map((prod) => {
                const mainImg = prod.product_images?.find((img: any) => img.sort_order === 0) || prod.product_images?.[0];
                return (
                  <div key={prod.id} className="col-12 col-md-4">
                    <Link href={`/product/${prod.id}`} className="text-decoration-none text-center d-block h-100">
                      <div className="card border-0 rounded-4 shadow-sm overflow-hidden p-3 bg-light h-100 d-flex flex-column justify-content-between">
                        <div className="w-100 rounded-3 overflow-hidden bg-white mb-3" style={{ height: "300px" }}>
                          {mainImg ? (
                            <img src={mainImg.image_url} alt={prod.name} className="w-100 h-100 object-fit-cover" />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light"><i className="bi bi-image text-muted fs-2"></i></div>
                          )}
                        </div>
                        <div>
                          <h5 className="fw-bold text-dark mb-1 text-truncate" style={{ fontFamily: "var(--font-heading)" }}>{prod.name}</h5>
                          <span className="text-primary fw-bold d-block mb-3">₹{Number(prod.price).toFixed(2)}</span>
                        </div>
                        <span className="btn btn-outline-primary btn-sm rounded-pill py-2 text-uppercase tracking-wider fw-semibold" style={{ fontSize: "0.75rem" }}>
                          View Product
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (activeTheme === "theme-crimson") {
      return (
        <section id="seasonal-picks" className="py-5 bg-white border-bottom border-light">
          <div className="container py-4">
            <div className="mb-5 text-center">
              <h3 className="h3 fw-bold text-dark mb-0" style={{ fontFamily: "var(--font-heading)" }}>Season&apos;s Pure Silks</h3>
              <p className="text-secondary small mb-0">Discover fine handcrafted luxury selections.</p>
            </div>
            <div className="row g-4">
              {displaySeasonal.map((prod) => {
                const mainImg = prod.product_images?.find((img: any) => img.sort_order === 0) || prod.product_images?.[0];
                return (
                  <div key={prod.id} className="col-12 col-md-6">
                    <Link href={`/product/${prod.id}`} className="text-decoration-none h-100 d-block">
                      <div className="card border-0 rounded-4 shadow-sm overflow-hidden bg-light h-100">
                        <div className="row g-0 h-100">
                          <div className="col-5 position-relative" style={{ minHeight: "220px" }}>
                            {mainImg ? (
                              <img src={mainImg.image_url} alt={prod.name} className="w-100 h-100 object-fit-cover position-absolute top-0 start-0" />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light position-absolute top-0 start-0"><i className="bi bi-image text-muted fs-3"></i></div>
                            )}
                          </div>
                          <div className="col-7 p-4 d-flex flex-column justify-content-between">
                            <div>
                              <span className="text-accent small fw-bold text-uppercase d-block mb-1">Handwoven</span>
                              <h5 className="fw-bold text-dark mb-2 text-truncate" style={{ fontFamily: "var(--font-heading)" }}>{prod.name}</h5>
                              <p className="text-secondary small mb-0 text-truncate-2" style={{ fontSize: "0.8rem", height: "40px", overflow: "hidden" }}>
                                {prod.description || "Discover premium weaves and heritage patterns."}
                              </p>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                              <span className="fw-bold text-dark font-monospace">₹{Number(prod.price).toFixed(2)}</span>
                              <span className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Shop</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    // Classic default layout grid (4 columns)
    return (
      <section id="seasonal-picks" className="py-5 bg-white">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <h3 className="h4 fw-bold mb-0 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              Seasonal picks
            </h3>
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary btn-sm rounded-circle p-2" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <button className="btn btn-outline-secondary btn-sm rounded-circle p-2" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-chevron-right"></i>
              </button>
              <a href="#best-offers" className="btn btn-primary btn-sm rounded-pill px-3 py-2 ms-2 fs-8 text-uppercase tracking-wider text-decoration-none">
                View All
              </a>
            </div>
          </div>

          <div className="row g-3 g-md-4">
            {displaySeasonal.length > 0 ? (
              displaySeasonal.map((prod) => {
                const mainImg = prod.product_images?.find((img: any) => img.sort_order === 0) || prod.product_images?.[0];
                return (
                  <div key={prod.id} className="col-6 col-md-3">
                    <Link href={`/product/${prod.id}`} className="text-decoration-none h-100 d-block">
                      <div className="wix-product-card p-3 h-100 d-flex flex-column justify-content-between">
                        <div>
                          <div className="wix-product-image-container rounded-sm mb-3 overflow-hidden bg-light d-flex align-items-center justify-content-center">
                            {mainImg ? (
                              <img src={mainImg.image_url} alt={prod.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="bi bi-image text-secondary fs-1"></i>
                            )}
                          </div>
                          <h5 className="h6 fw-semibold text-dark mb-1 text-truncate" title={prod.name}>{prod.name}</h5>
                          <div className="wix-stars mb-2">
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                          </div>
                        </div>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mt-2">
                          <span className="fw-bold text-dark">₹{Number(prod.price).toFixed(2)}</span>
                          <span className={`badge rounded-pill px-2 py-1 fs-9 ${
                            prod.stock_quantity > 0 
                              ? "bg-success-subtle text-success border border-success" 
                              : "bg-danger-subtle text-danger border border-danger"
                          }`}>
                            {prod.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })
            ) : (
              <>
                {["Banarasi Silk Dupatta", "Crimson Pashmina Wrap", "Sand Woven Linen", "Bespoke Brocade"].map((name, i) => (
                  <div key={i} className="col-6 col-md-3">
                    <div className="wix-product-card p-3">
                      <div className="wix-product-image-container rounded-sm mb-3">
                        <img src={i % 2 === 0 ? "/images/hero-silk.png" : "/images/hero-cashmere.png"} alt={name} />
                      </div>
                      <h5 className="h6 fw-semibold text-dark mb-1 text-truncate">{name}</h5>
                      <div className="wix-stars mb-2">
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                        <span className="fw-bold text-dark">₹1,500.00</span>
                        <a href="#best-offers" className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fs-8 text-decoration-none w-100 w-sm-auto text-center">
                          Shop
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-white" style={{ scrollBehavior: "smooth" }}>
      {/* Wix Style Responsive Navbar */}
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-grow-1">
        
        {/* Render hero layout */}
        {renderHero()}

        {/* Render popular categories layout */}
        {renderCategories()}

        {/* New Collections */}
        {showCollections && (
          <section id="new-collections" className="py-5 bg-light">
            <div className="container py-4">
              <h3 className="h4 fw-bold mb-5 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
                New collections
              </h3>
              
              <div className="row g-4">
                {activeNewCollections.length > 0 ? (
                  activeNewCollections.map((c) => (
                    <div key={c.id} className="col-12 col-md-4 animate-fade-in">
                      <div className="wix-product-card bg-white p-3 h-100 d-flex flex-column justify-content-between">
                        <div>
                          <div className="wix-product-image-container rounded-sm mb-3 overflow-hidden bg-light d-flex align-items-center justify-content-center" style={{ height: "240px" }}>
                            {c.image_url ? (
                              <img src={c.image_url} alt={c.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="bi bi-image text-secondary fs-1"></i>
                            )}
                          </div>
                          <h4 className="h6 fw-bold text-dark mb-2">{c.name}</h4>
                          <p className="small text-secondary mb-3" style={{ height: "40px", overflow: "hidden" }}>
                            {c.description || "Discover premium weaves and heritage patterns."}
                          </p>
                        </div>
                        <Link href={`/category/${c.slug}`} className="small fw-semibold text-primary text-decoration-none mt-2">
                          See All <i className="bi bi-arrow-right small"></i>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Collection Card 1 */}
                    <div className="col-12 col-md-4">
                      <div className="wix-product-card bg-white p-3">
                        <div className="wix-product-image-container rounded-sm mb-3">
                          <img src="/images/hero-silk.png" alt="Men's collection" />
                        </div>
                        <h4 className="h6 fw-bold text-dark mb-2">Men&apos;s luxury winter threadwork</h4>
                        <p className="small text-secondary mb-3" style={{ height: "40px", overflow: "hidden" }}>
                          Intricate shawl and sherwani fabric crafted with pure golden zari work.
                        </p>
                        <a href="#seasonal-picks" className="small fw-semibold text-primary text-decoration-none">
                          See All <i className="bi bi-arrow-right small"></i>
                        </a>
                      </div>
                    </div>
                    
                    {/* Collection Card 2 */}
                    <div className="col-12 col-md-4">
                      <div className="wix-product-card bg-white p-3">
                        <div className="wix-product-image-container rounded-sm mb-3">
                          <img src="/images/hero-cashmere.png" alt="Women's Collection" />
                        </div>
                        <h4 className="h6 fw-bold text-dark mb-2">Women&apos;s exquisite bridal silk</h4>
                        <p className="small text-secondary mb-3" style={{ height: "40px", overflow: "hidden" }}>
                          Bridal collection loaded with traditional patterns and soft crimson draping.
                        </p>
                        <a href="#seasonal-picks" className="small fw-semibold text-primary text-decoration-none">
                          See All <i className="bi bi-arrow-right small"></i>
                        </a>
                      </div>
                    </div>
 
                    {/* Collection Card 3 */}
                    <div className="col-12 col-md-4">
                      <div className="wix-product-card bg-white p-3">
                        <div className="wix-product-image-container rounded-sm mb-3">
                          <img src="/images/hero-linen.png" alt="Couple's Collection" />
                        </div>
                        <h4 className="h6 fw-bold text-dark mb-2">Premium hand-spun cashmere sets</h4>
                        <p className="small text-secondary mb-3" style={{ height: "40px", overflow: "hidden" }}>
                          Warm pashminas, muffler designs, and custom weaves for couples.
                        </p>
                        <a href="#seasonal-picks" className="small fw-semibold text-primary text-decoration-none">
                          See All <i className="bi bi-arrow-right small"></i>
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Render seasonal picks layout */}
        {renderSeasonalPicks()}

        {/* Our Best Offer For Today */}
        {showOffers && (
          <section id="best-offers" className="py-5 bg-light border-top border-bottom border-light">
            <div className="container py-4">
              <h3 className="h4 text-center fw-bold mb-5 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
                Our best offer for today
              </h3>

              <div className="row g-3 g-md-4">
                {displayOffers.length > 0 ? (
                  displayOffers.map((prod) => {
                    const mainImg = prod.product_images?.find((img: any) => img.sort_order === 0) || prod.product_images?.[0];
                    return (
                      <div key={prod.id} className="col-6 col-md-3">
                        <Link href={`/product/${prod.id}`} className="text-decoration-none h-100 d-block">
                          <div className="wix-product-card bg-white p-3 h-100 d-flex flex-column justify-content-between">
                            <div>
                              <div className="wix-product-image-container rounded-sm mb-3 overflow-hidden bg-light d-flex align-items-center justify-content-center">
                                {mainImg ? (
                                  <img src={mainImg.image_url} alt={prod.name} className="w-100 h-100 object-fit-cover" />
                                ) : (
                                  <i className="bi bi-image text-secondary fs-1"></i>
                                )}
                              </div>
                              <h5 className="h6 fw-semibold mb-1 text-dark text-truncate" title={prod.name}>{prod.name}</h5>
                              <div className="wix-stars mb-2">
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                              </div>
                              <div className="d-flex gap-2 align-items-center mb-3">
                                <span className="fw-bold text-dark">₹{Number(prod.price).toFixed(2)}</span>
                                {prod.compare_at_price && Number(prod.compare_at_price) > Number(prod.price) && (
                                  <span className="text-muted text-decoration-line-through small">
                                    ₹{Number(prod.compare_at_price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`badge rounded-pill py-2 w-100 text-center text-uppercase fs-9 fw-semibold ${
                              prod.stock_quantity > 0 
                                ? "bg-success-subtle text-success border border-success" 
                                : "bg-danger-subtle text-danger border border-danger"
                            }`}>
                              {prod.stock_quantity > 0 ? "In Stock" : "Out of stock"}
                            </span>
                          </div>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <>
                    {/* Offer Card 1 */}
                    <div className="col-6 col-md-3">
                      <div className="wix-product-card bg-white p-3">
                        <div className="wix-product-image-container rounded-sm mb-3">
                          <img src="/images/hero-silk.png" alt="Silk Saree" />
                        </div>
                        <h5 className="h6 fw-semibold mb-1 text-dark text-truncate">Kanchipuram Silk Saree</h5>
                        <div className="wix-stars mb-2">
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                        </div>
                        <div className="d-flex gap-2 align-items-center mb-3">
                          <span className="fw-bold text-dark">₹190.00</span>
                          <span className="text-muted text-decoration-line-through small">₹240.00</span>
                        </div>
                        <a href="#why-choose-us" className="btn btn-outline-primary btn-sm w-100 rounded-pill py-2 text-uppercase fs-8 fw-semibold text-decoration-none text-center">
                          Shop Now
                        </a>
                      </div>
                    </div>

                    {/* Offer Card 2 */}
                    <div className="col-6 col-md-3">
                      <div className="wix-product-card bg-white p-3">
                        <div className="wix-product-image-container rounded-sm mb-3">
                          <img src="/images/hero-cashmere.png" alt="Cashmere Scarf" />
                        </div>
                        <h5 className="h6 fw-semibold mb-1 text-dark text-truncate">Organic Pashmina Shawl</h5>
                        <div className="wix-stars mb-2">
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                        </div>
                        <div className="d-flex gap-2 align-items-center mb-3">
                          <span className="fw-bold text-dark">₹110.00</span>
                          <span className="text-muted text-decoration-line-through small">₹150.00</span>
                        </div>
                        <a href="#why-choose-us" className="btn btn-outline-primary btn-sm w-100 rounded-pill py-2 text-uppercase fs-8 fw-semibold text-decoration-none text-center">
                          Shop Now
                        </a>
                      </div>
                    </div>

                    {/* Offer Card 3 */}
                    <div className="col-6 col-md-3">
                      <div className="wix-product-card bg-white p-3">
                        <div className="wix-product-image-container rounded-sm mb-3">
                          <img src="/images/hero-linen.png" alt="Linen Garment" />
                        </div>
                        <h5 className="h6 fw-semibold mb-1 text-dark text-truncate">Summer Linen Fabric</h5>
                        <div className="wix-stars mb-2">
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-half"></i>
                        </div>
                        <div className="d-flex gap-2 align-items-center mb-3">
                          <span className="fw-bold text-dark">₹32.00</span>
                          <span className="text-muted text-decoration-line-through small">₹42.00</span>
                        </div>
                        <a href="#why-choose-us" className="btn btn-outline-primary btn-sm w-100 rounded-pill py-2 text-uppercase fs-8 fw-semibold text-decoration-none text-center">
                          Shop Now
                        </a>
                      </div>
                    </div>

                    {/* Offer Card 4 */}
                    <div className="col-6 col-md-3">
                      <div className="wix-product-card bg-white p-3">
                        <div className="wix-product-image-container rounded-sm mb-3">
                          <img src="/images/auth-bg.png" alt="Brocade fabric" />
                        </div>
                        <h5 className="h6 fw-semibold mb-1 text-dark text-truncate">Premium Zari Brocade</h5>
                        <div className="wix-stars mb-2">
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star"></i>
                        </div>
                        <div className="d-flex gap-2 align-items-center mb-3">
                          <span className="fw-bold text-dark">₹75.00</span>
                          <span className="text-muted text-decoration-line-through small">₹90.00</span>
                        </div>
                        <a href="#why-choose-us" className="btn btn-outline-primary btn-sm w-100 rounded-pill py-2 text-uppercase fs-8 fw-semibold text-decoration-none text-center">
                          Shop Now
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        {showWhyChooseUs && (
          <section id="why-choose-us" className="py-5 bg-white">
            <div className="container py-4">
              <h3 className="h4 text-center fw-bold mb-5 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
                Why choose us
              </h3>

              <div className="row g-4 text-center text-md-start">
                {/* Point 1 */}
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2">
                    <div className="text-primary mb-3"><i className="bi bi-truck fs-3"></i></div>
                    <h5 className="h6 fw-bold mb-2">First Delivery</h5>
                    <p className="small text-secondary mb-0">Express courier dispatch to global destinations, packaged in cedarwood protection boxes.</p>
                  </div>
                </div>

                {/* Point 2 */}
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2">
                    <div className="text-primary mb-3"><i className="bi bi-chat-dots fs-3"></i></div>
                    <h5 className="h6 fw-bold mb-2">24/7 Support</h5>
                    <p className="small text-secondary mb-0">Bespoke shopping concierge support to help you match fabric weights, colors, and thread counts.</p>
                  </div>
                </div>

                {/* Point 3 */}
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2">
                    <div className="text-primary mb-3"><i className="bi bi-shield-check fs-3"></i></div>
                    <h5 className="h6 fw-bold mb-2">4.9 Ratings</h5>
                    <p className="small text-secondary mb-0">Highly rated by elite fashion ateliers and designer boutique makers worldwide.</p>
                  </div>
                </div>

                {/* Point 4 */}
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2">
                    <div className="text-primary mb-3"><i className="bi bi-award fs-3"></i></div>
                    <h5 className="h6 fw-bold mb-2">10 Years Services</h5>
                    <p className="small text-secondary mb-0">Over a decade sourcing handloom masterpieces and providing high-end fabric solutions.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Client Testimonial Section */}
        {showTestimonial && (
          <section className="py-5 bg-light border-top border-light">
            <div className="container py-4 text-center">
              <h3 className="h4 fw-bold mb-4 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
                What our clients say
              </h3>
              
              <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                  <div className="mb-3 text-primary"><i className="bi bi-quote fs-1"></i></div>
                  <p className="lead fs-6 text-dark fw-light mb-4" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: "1.8" }}>
                    &ldquo;Aura.weaves provides our design studio with silk of unmatched purity. The golden zari threads remain bright, and the fabric has a wonderful, fluid drape. A truly premium service.&rdquo;
                  </p>
                  
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <span className="fw-bold small text-dark">Jane Cooper</span>
                    <span className="text-muted small">|</span>
                    <span className="text-secondary small">Creative Director, Coop Fashion</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Instagram/Connect Gallery */}
        {showInstagram && (
          <section className="py-5 bg-white border-top border-light">
            <div className="container-fluid px-lg-5">
              <h3 className="h4 text-center fw-bold mb-5 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
                Connect with us
              </h3>

              <div className="row g-3">
                {/* Instagram Item 1 */}
                <div className="col-6 col-md-3">
                  <div className="instagram-img-container">
                    <img src="/images/hero-silk.png" alt="Fabric photoshoot" className="w-100 h-100 object-fit-cover" />
                  </div>
                </div>

                {/* Instagram Item 2 */}
                <div className="col-6 col-md-3">
                  <div className="instagram-img-container">
                    <img src="/images/hero-cashmere.png" alt="Cashmere craft" className="w-100 h-100 object-fit-cover" />
                  </div>
                </div>

                {/* Instagram Item 3 */}
                <div className="col-6 col-md-3">
                  <div className="instagram-img-container">
                    <img src="/images/hero-linen.png" alt="Linen model" className="w-100 h-100 object-fit-cover" />
                  </div>
                </div>

                {/* Instagram Item 4 */}
                <div className="col-6 col-md-3">
                  <div className="instagram-img-container">
                    <img src="/images/auth-bg.png" alt="Brocade design" className="w-100 h-100 object-fit-cover" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
