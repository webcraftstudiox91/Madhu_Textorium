import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Madhu Textorium | Premium Custom Tailoring – Visakhapatnam",
  description:
    "Madhu Textorium offers premium custom-tailored menswear in Visakhapatnam — suits, sherwanis, Modi coats, Jodhpuri, shirts and more. Perfect fit guaranteed. WhatsApp enquiries welcome.",
  keywords:
    "Madhu Textorium, custom tailoring Visakhapatnam, suits Vizag, sherwani stitching, Modi coat, Jodhpuri suit, men's clothing Vizag",
  openGraph: {
    title: "Madhu Textorium | Premium Custom Tailoring",
    description:
      "Visakhapatnam's premier custom tailoring house. Suits, sherwanis, Modi coats & more — perfectly stitched to your measurements.",
    type: "website",
    locale: "en_IN",
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
