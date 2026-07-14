import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Outfit, Cinzel, Montserrat, Prata } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapClient from "@/components/BootstrapClient";
import { Toaster } from "react-hot-toast";
import { createClient } from "@/lib/supabase/server";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body-classic",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading-classic",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body-emerald",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-heading-emerald",
  weight: ["400", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body-crimson",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const prata = Prata({
  subsets: ["latin"],
  variable: "--font-heading-crimson",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Aura Weaves | Premium Modern Textile eCommerce",
  description:
    "Experience the finest artisan textiles, luxury fabrics, and bespoke wedding collections designed for true connoisseurs.",
  keywords: "luxury textiles, premium fabric, silks, wedding collection, bespoke textiles, designer weave",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeTheme = "theme-classic";

  try {
    const supabase = await createClient();
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("group", "cms")
      .eq("key", "active_theme")
      .single();

    if (setting?.value) {
      activeTheme = setting.value;
    }
  } catch (e) {
    // Fallback to classic
  }

  return (
    <html lang="en" className={`${plusJakarta.variable} ${playfair.variable} ${outfit.variable} ${cinzel.variable} ${montserrat.variable} ${prata.variable}`}>
      <body className={activeTheme}>
        <BootstrapClient />
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            style: {
              background: '#1b1d21',
              color: '#fff',
              fontFamily: 'var(--font-plus-jakarta)',
              fontSize: '0.9rem',
              borderRadius: '20px',
            }
          }} 
        />
        {children}
      </body>
    </html>
  );
}
