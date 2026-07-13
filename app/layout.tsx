import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Madhu Textorium | Premium Men's Custom Tailoring - Vizag & Visakhapatnam",
  description:
    "Madhu Textorium is the premier custom tailoring house in Visakhapatnam, India. We design and stitch premium men's wedding dresses, groom wear, suits, sherwanis, Jodhpuris, Modi coats, blazers, trousers, and shirts. Book custom tailoring online from any corner of India and the world.",
  keywords: [
    "Madhu Textorium",
    "Madhu Textorian",
    "Madhu Textorium Vizag",
    "Madhu Textorian Vizag",
    "Madhu Textorium Visakhapatnam",
    "best tailors in Vizag",
    "mens tailors in Visakhapatnam",
    "custom tailoring Vizag",
    "wedding dresses for men",
    "groom wedding sherwani Visakhapatnam",
    "men wedding suits Vizag",
    "Sherwani in Vizag",
    "Suits in Vizag",
    "Shirts in Vizag",
    "Pants in Vizag",
    "Modi Coat in Vizag",
    "Jodhpuri in Vizag",
    "Blazers in Vizag",
    "Kurta in Vizag",
    "Sherwani Visakhapatnam",
    "Suits Visakhapatnam",
    "Shirts Visakhapatnam",
    "Pants Visakhapatnam",
    "Modi Coat Visakhapatnam",
    "Jodhpuri Visakhapatnam",
    "Blazers Visakhapatnam",
    "Kurta Visakhapatnam",
    "bespoke suits Vizag",
    "designer suits Visakhapatnam",
    "sherwani stitching Vizag",
    "Nehru jacket tailoring Visakhapatnam"
  ],
  alternates: {
    canonical: "https://madhutextorium.com",
  },
  openGraph: {
    title: "Madhu Textorium | Premium Men's Custom Tailoring - Vizag & Visakhapatnam",
    description:
      "Visakhapatnam's premier custom tailoring house. Design and stitch wedding dresses, royal sherwanis, custom suits, Jodhpuris, Modi coats, shirts and pants.",
    url: "https://madhutextorium.com",
    siteName: "Madhu Textorium",
    images: [
      {
        url: "https://images.madhutextorium.com/images/logo.png",
        width: 800,
        height: 800,
        alt: "Madhu Textorium Logo",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: "Madhu Textorium | Premium Men's Custom Tailoring - Vizag & Visakhapatnam",
    description: "Visakhapatnam's premier custom tailoring house. Bespoke suits, sherwanis, Modi coats & more.",
    images: ["https://images.madhutextorium.com/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: browser extensions (Liner, etc.) inject attributes
    // like data-be-installed onto <html>/<body> which causes harmless hydration
    // warnings unrelated to our app code.
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
