import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Customization of Sherwani, Suits, Shirts & Groom Wear | Madhu Textorium",
  description:
    "Customize and design your perfect custom clothing online at Madhu Textorium. Choose from customization of Sherwani, suits, shirts, Jodhpuri, Modi coats, trousers, and blazers. Tailored to your measurements and delivered worldwide.",
  keywords: [
    "customization of Sherwani",
    "customization of shirt",
    "customization of suits",
    "customization of Jodhpuri",
    "customization of Modi coat",
    "customization of Pants",
    "customization of Blazers",
    "customization of Kurta",
    "online customization of wedding wear",
    "custom shirt tailoring online",
    "custom suit maker Vizag",
    "stitch sherwani online India",
    "bespoke suit customization",
    "Madhu Textorium customize"
  ],
  alternates: {
    canonical: "https://madhutextorium.com/customize",
  },
  openGraph: {
    title: "Online Customization of Sherwani, Suits, Shirts & Groom Wear | Madhu Textorium",
    description:
      "Design and customize your garments online. Tailor wedding wear, executive suits, royal Jodhpuris, Modi jackets, shirts, and trousers with step-by-step measurements.",
    url: "https://madhutextorium.com/customize",
    type: "website",
    locale: "en_IN",
  },
};

export default function CustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
