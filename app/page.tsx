'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaWhatsapp, FaStar, FaQuoteLeft } from 'react-icons/fa';
import {
  FiArrowRight, FiCheck, FiChevronLeft, FiChevronRight,
  FiPhone, FiMapPin, FiSmartphone, FiScissors, FiAward,
} from 'react-icons/fi';
import { MdStraighten, MdCamera, MdDone } from 'react-icons/md';
import { GiSewingNeedle, GiClothes, GiTie } from 'react-icons/gi';
import { PiScissors, PiRuler } from 'react-icons/pi';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import ProductModal, { Product, FabricSwatch } from '@/components/ProductModal/ProductModal';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

// ─── Cloudflare R2 CDN base URL ───────────────────────────────────────────────
// All images are served from R2 so Vercel never processes or serves image bytes.
// This keeps Vercel bandwidth + image optimisation usage at zero.
const R2 = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL ?? '';

// ─── DATA ────────────────────────────────────────────────
const USP_ITEMS = [
  { icon: <PiScissors size={24} />, title: 'Custom Design Clothes', desc: 'Every garment crafted to your exact vision' },
  { icon: <PiRuler size={24} />, title: 'Custom Measurements', desc: 'Tailor-precise fit with full body measurements' },
  { icon: <FaWhatsapp size={24} />, title: 'WhatsApp Ordering', desc: 'Send enquiries directly from your phone' },
  { icon: <FiAward size={24} />, title: 'Perfect Fit Guarantee', desc: 'Not satisfied? We re-stitch until flawless' },
];

const CATEGORIES = [
  { id: 'suits', name: 'Suits', image: `${R2}/images/real/suits/suits/IMG_20260702_130035.png.jpeg`, desc: 'Classic & Modern Cuts' },
  { id: 'shirts', name: 'Shirts', image: `${R2}/images/real/shirts/shirts/IMG_20260702_134315.jpg.jpeg`, desc: 'Premium Formal & Casual' },
  { id: 'pants', name: 'Pants', image: `${R2}/images/real/pants/pants/IMG_20260702_134436.png.jpeg`, desc: 'Perfect Drape & Fit' },
  { id: 'modi-coat', name: 'Modi Coat', image: `${R2}/images/real/modi-coat/modi-coat/IMG_20260702_130607.png.jpeg`, desc: 'Refined Indian Formal' },
  { id: 'jodhpuri', name: 'Jodhpuri', image: `${R2}/images/real/jodhpuri/jodhpuri/IMG_20260702_125452.png.jpeg`, desc: 'Regal Traditional Wear' },
  { id: 'sherwani', name: 'Sherwani', image: `${R2}/images/real/sherwani/sherwani/IMG_20260702_125913.png.jpeg`, desc: 'Wedding & Ceremony' },
  { id: 'blazer', name: 'Blazers', image: `${R2}/images/real/blazers/blazers/IMG_20260702_130317.png.jpeg`, desc: 'Smart Business Style' },
  { id: 'kurta', name: 'Kurta', image: `${R2}/images/real/kurta/kurta/IMG_20260702_130159.png.jpeg`, desc: 'Festive & Ethnic Grace' },
];

// ─── Per-category fabric swatches ──────────────────────────────────────────

const FABRIC_DATA: Record<string, FabricSwatch[]> = {
  'Suits':     [{ id: 'suits-f1',     name: 'Charcoal Herringbone Wool', image: `${R2}/images/fabrics/fabric-suits.png` }],
  'Shirts':    [{ id: 'shirts-f1',    name: 'White Oxford Cotton',        image: `${R2}/images/fabrics/fabric-shirts.png` }],
  'Pants':     [{ id: 'pants-f1',     name: 'Navy Gabardine',             image: `${R2}/images/fabrics/fabric-pants.png` }],
  'Modi Coat': [{ id: 'modi-f1',      name: 'Royal Blue Brocade',         image: `${R2}/images/fabrics/fabric-modi-coat.png` }],
  'Jodhpuri':  [{ id: 'jodh-f1',      name: 'Deep Maroon Silk',           image: `${R2}/images/fabrics/fabric-jodhpuri.png` }],
  'Sherwani':  [{ id: 'sher-f1',      name: 'Ivory Gold Brocade',         image: `${R2}/images/fabrics/fabric-sherwani.png` }],
  'Blazers':   [{ id: 'blaz-f1',      name: 'Navy Blue Tweed',            image: `${R2}/images/fabrics/fabric-blazers.png` }],
  'Kurta':     [{ id: 'kurta-f1',     name: 'White Cotton Mulmul',        image: `${R2}/images/fabrics/fabric-kurta.png` }],
};

// ─── Per-category garment outline sketches ──────────────────────────────────
const SKETCH_MAP: Record<string, string> = {
  'Suits':     `${R2}/images/sketches/sketch-suits.jpeg`,
  'Shirts':    `${R2}/images/sketches/sketch-shirts.jpeg`,
  'Pants':     `${R2}/images/sketches/sketch-pants.jpeg`,
  'Modi Coat': `${R2}/images/sketches/sketch-modi-coat.jpeg`,
  'Jodhpuri':  `${R2}/images/sketches/sketch-jodhpuri.jpeg`,
  'Sherwani':  `${R2}/images/sketches/sketch-sherwani.jpeg`,
  'Blazers':   `${R2}/images/sketches/sketch-blazers.jpeg`,
  'Kurta':     `${R2}/images/sketches/sketch-kurta.jpeg`,
};

// Helper: enrich a raw product with per-category swatch + sketch data
function withMeta(p: Omit<Product, 'fabricSwatches' | 'sketchImage'>): Product {
  return {
    ...p,
    fabricSwatches: FABRIC_DATA[p.category] || [],
    sketchImage:    SKETCH_MAP[p.category]  || undefined,
  };
}

const STATIC_PRODUCTS: Product[] = [
  withMeta({ id: 'p1', name: 'Royal Heritage Suit', category: 'Suits', price: 8500, isTopSeller: true,
    image: `${R2}/images/real/suits/royal-heritage-suit-2/IMG_20260702_130407.png.jpeg`,
    imageFav: `${R2}/images/real/suits/royal-heritage-suit-1/IMG_20260702_130252.png.jpeg` }),
  withMeta({ id: 'p3', name: 'Shirts', category: 'Shirts', price: 2400,
    image: `${R2}/images/real/shirts/shirts/IMG_20260702_134315.jpg.jpeg`,
    imageFav: `${R2}/images/real/shirts/oxford-shirt/IMG_20260702_134328.png.jpeg` }),
  withMeta({ id: 'p4', name: 'Modi Coat', category: 'Modi Coat', price: 5500,
    image: `${R2}/images/real/modi-coat/modi-coat/IMG_20260702_130607.png.jpeg`,
    imageFav: `${R2}/images/real/modi-coat/modi-coat-ensemble/IMG_20260702_130732.png.jpeg` }),
  withMeta({ id: 'p5', name: 'Jodhpuri Classic', category: 'Jodhpuri', price: 9500, isTopSeller: true,
    image: `${R2}/images/real/jodhpuri/jodhpuri-classic-2/IMG_20260702_130858.png.jpeg`,
    imageFav: `${R2}/images/real/jodhpuri/jodhpuri-classic-1/IMG_20260702_130529.png.jpeg` }),
  withMeta({ id: 'p6', name: 'Grand Sherwani Set', category: 'Sherwani', price: 12000, isTopSeller: true,
    image: `${R2}/images/real/sherwani/grand-sherwani-2/IMG_20260702_125944.png.jpeg`,
    imageFav: `${R2}/images/real/sherwani/grand-sherwani-1/IMG_20260702_130111.png.jpeg` }),
  withMeta({ id: 'p7', name: 'Blazers', category: 'Blazers', price: 5800,
    image: `${R2}/images/real/blazers/blazers/IMG_20260702_130317.png.jpeg`,
    imageFav: `${R2}/images/real/blazers/business-blazer/IMG_20260702_125737.png.jpeg` }),
  withMeta({ id: 'p8', name: 'Kurta', category: 'Kurta', price: 3200,
    image: `${R2}/images/real/kurta/kurta/IMG_20260702_130159.png.jpeg`,
    imageFav: `${R2}/images/real/kurta/festive-kurta/IMG_20260702_130351.png.jpeg` }),
  withMeta({ id: 'p9', name: 'Pants', category: 'Pants', price: 2800,
    image: `${R2}/images/real/pants/pants/IMG_20260702_134436.png.jpeg`,
    imageFav: `${R2}/images/real/pants/merino-trousers/IMG_20260702_134403.png.jpeg` }),
  withMeta({ id: 'p10', name: 'Three-Piece Prestige Suit', category: 'Suits', price: 14000, isTopSeller: true,
    image: `${R2}/images/real/suits/three-piece-suit-2/IMG_20260702_125853.png.jpeg`,
    imageFav: `${R2}/images/real/suits/three-piece-suit-1/IMG_20260702_130224.png.jpeg` }),
  
  withMeta({ id: 'p11', name: 'Suits', category: 'Suits', price: 8500,
    image: `${R2}/images/real/suits/suits/IMG_20260702_130035.png.jpeg`,
    imageFav: `${R2}/images/real/suits/suits/IMG_20260702_130035.png.jpeg` }),
  withMeta({ id: 'p12', name: 'Jodhpuri', category: 'Jodhpuri', price: 9500,
    image: `${R2}/images/real/jodhpuri/jodhpuri/IMG_20260702_125452.png.jpeg`,
    imageFav: `${R2}/images/real/jodhpuri/jodhpuri/IMG_20260702_125452.png.jpeg` }),
  withMeta({ id: 'p13', name: 'Sherwani', category: 'Sherwani', price: 12000,
    image: `${R2}/images/real/sherwani/sherwani/IMG_20260702_125913.png.jpeg`,
    imageFav: `${R2}/images/real/sherwani/sherwani/IMG_20260702_125913.png.jpeg` }),
];

const REVIEWS = [
  { name: 'Ravi Shankar P.', role: 'Corporate Professional, Vizag', review: 'Absolutely stunning suit! The fit was perfect on the first try. Madhu Textorium\'s craftsmanship is unmatched in all of Visakhapatnam.', stars: 5, initials: 'RS' },
  { name: 'Anil Kumar M.', role: 'Wedding Client', review: 'Got my Sherwani done for my wedding — every single guest complimented it. The fabric quality and stitching precision is top notch!', stars: 5, initials: 'AK' },
  { name: 'Suresh Babu G.', role: 'Business Owner', review: 'I\'ve been a regular customer for 6 years. The Modi coat they made for my daughter\'s wedding was the talk of the ceremony.', stars: 5, initials: 'SB' },
  { name: 'Venkat Rao T.', role: 'Software Engineer', review: 'Ordered 3 shirts via WhatsApp with my measurements. All three fit like they were made by machine — with human precision!', stars: 5, initials: 'VR' },
  { name: 'Prakash Reddy', role: 'Retired IAS Officer', review: 'The Jodhpuri suit for my son\'s wedding was breathtaking. Attention to every detail — buttons, lining, embroidery — simply masterful.', stars: 5, initials: 'PR' },
];

const HOW_TO_STEPS = [
  { step: '01', title: 'Choose Your Garment', desc: 'Select from suits, shirts, sherwani, kurta, Modi coats and more.', icon: <GiClothes size={28} /> },
  { step: '02', title: 'Share Measurements', desc: 'Fill in tailor-level measurements — chest, waist, shoulder, sleeve and more.', icon: <MdStraighten size={28} /> },
  { step: '03', title: 'Upload Body Photos', desc: 'Send 3 photos — front, back, and side profile for a flawless custom fit.', icon: <MdCamera size={28} /> },
  { step: '04', title: 'WhatsApp Confirmation', desc: 'All details arrive on WhatsApp. We confirm, discuss fabric, and get started.', icon: <MdDone size={28} /> },
];

const WHATSAPP_NUMBER = '919030727629';
const waLink = (msg: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://madhutextorium.com/#localbusiness",
      "name": "Madhu Textorium",
      "image": "https://images.madhutextorium.com/images/logo.png",
      "url": "https://madhutextorium.com",
      "telephone": "+919030727629",
      "priceRange": "INR",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Door No 27-4-30, Beside Super Bazar, Main Road, Poorna Market",
        "addressLocality": "Visakhapatnam",
        "addressRegion": "Andhra Pradesh",
        "postalCode": "530002",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "17.72197",
        "longitude": "83.29652"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "10:00",
          "closes": "21:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "15:00",
          "closes": "21:00"
        }
      ],
      "sameAs": [
        "https://wa.me/919030727629"
      ]
    },
    {
      "@type": "ClothingStore",
      "@id": "https://madhutextorium.com/#store",
      "name": "Madhu Textorium",
      "description": "Premium men's custom tailoring and fabric house in Visakhapatnam. Tailoring wedding sherwanis, suits, Jodhpuris, Modi coats, shirts and pants.",
      "parentOrganization": {
        "@type": "Organization",
        "name": "Madhu Textorium",
        "url": "https://madhutextorium.com"
      }
    }
  ]
};

export default function HomePage() {
  const { addItem } = useCart();
  const { theme } = useTheme();
  const [reviewIdx, setReviewIdx] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const reviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dynamic products list from Supabase with local fallback
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const supabase = createClient();
        
        // Fetch products
        const { data: dbProducts, error: pError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (pError) throw pError;

        if (dbProducts && dbProducts.length > 0) {
          // Fetch fabric swatches (the clothes/swatches)
          const { data: dbSwatches, error: sError } = await supabase
            .from('fabric_swatches')
            .select('*');

          if (sError) throw sError;

          // Map database records to the UI Product model
          const enriched = (dbProducts || []).map(p => {
            // Get all swatches from products belonging to the same category
            const categoryProducts = dbProducts.filter(dp => dp.category === p.category);
            const categoryProductIds = categoryProducts.map(dp => dp.id);
            
            const rawSwatches = (dbSwatches || [])
              .filter(sw => categoryProductIds.includes(sw.product_id) && sw.is_visible !== false);
            
            // Deduplicate by swatch image URL
            const swatchMap = new Map();
            rawSwatches.forEach(sw => {
              swatchMap.set(sw.image.trim().toLowerCase(), {
                id: sw.id,
                name: sw.name,
                image: sw.image
              });
            });
            const productSwatches = Array.from(swatchMap.values());

            return {
              id: p.id,
              name: p.name,
              category: p.category,
              price: Number(p.price),
              isTopSeller: p.is_top_seller,
              image: p.image || undefined,
              imageFav: p.image_fav || undefined,
              sketchImage: p.sketch_image || undefined,
              description: p.description || undefined,
              colors: p.colors || [],
              fabrics: p.fabrics || [],
              features: p.features || [],
              fabricSwatches: productSwatches,
              images: [p.image, p.image_fav].filter(Boolean) as string[],
            };
          });

          setProducts(enriched);
        }
      } catch (err) {
        console.error('Failed to load products from database, using static fallback:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const topSellers = products.filter(p => p.isTopSeller);

  // Pick hero image based on current theme
  const heroSrc = theme === 'light' ? `${R2}/images/hero-light.png` : `${R2}/images/hero.png`;

  // Reset hero animation when theme switches
  useEffect(() => {
    setHeroLoaded(false);
    const t = setTimeout(() => setHeroLoaded(true), 50);
    return () => clearTimeout(t);
  }, [theme]);

  const resetReviewTimer = useCallback(() => {
    if (reviewTimerRef.current) clearInterval(reviewTimerRef.current);
    reviewTimerRef.current = setInterval(() => {
      setReviewIdx(i => (i + 1) % REVIEWS.length);
    }, 5000);
  }, []);

  useEffect(() => {
    resetReviewTimer();
    return () => { if (reviewTimerRef.current) clearInterval(reviewTimerRef.current); };
  }, [resetReviewTimer]);

  const prevReview = () => { resetReviewTimer(); setReviewIdx(i => (i - 1 + REVIEWS.length) % REVIEWS.length); };
  const nextReview = () => { resetReviewTimer(); setReviewIdx(i => (i + 1) % REVIEWS.length); };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Product Modal */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* ═══ HERO ═══ */}
      <section id="home" className={styles.hero}>
        <div className={styles.heroBg}>
          <Image
            key={heroSrc}
            src={heroSrc}
            alt="Premium fabrics and garments at Madhu Textorium"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            onLoad={() => setHeroLoaded(true)}
          />
        </div>
        <div className={`${styles.heroContent} ${heroLoaded ? styles.heroContentLoaded : ''}`}>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>40+</span>
              <span className={styles.heroStatLabel}>Years of Excellence</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>5000+</span>
              <span className={styles.heroStatLabel}>Happy Customers</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>100%</span>
              <span className={styles.heroStatLabel}>Custom Fit</span>
            </div>
          </div>
        </div>
        <div className={styles.heroScroll}>
          <div className={styles.scrollLine} />
          <span className={styles.scrollText}>Scroll</span>
        </div>
      </section>

      {/* ═══ HERO DETAILS (BROWN BACKGROUND) ═══ */}
      <section className={styles.heroDetails}>
        <div className="container">
          <div className={styles.heroDetailsContent}>
            <div className={styles.heroDetailsLabel}>
              <span className={styles.heroDetailsDot} />
              Visakhapatnam&apos;s Premier Tailoring House
              <span className={styles.heroDetailsDot} />
            </div>
            <h1 className={styles.heroDetailsTitle}>
              Level Up <span>Your Style</span>
            </h1>
            <p className={styles.heroDetailsSubtitle}>
              Custom-tailored suits, sherwanis, Modi coats &amp; more — stitched to your exact body
              measurements for an unmatched perfect fit, every time.
            </p>
            <div className={styles.heroDetailsActions}>
              <Link href="/customize" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '0.95rem' }}>
                <FiScissors size={15} />
                Start Customizing
              </Link>
              <a href="https://photos.app.goo.gl/kLRStaGrzNJUqj6t8" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#F5EDD5', borderColor: 'rgba(245,237,213,0.3)', padding: '14px 36px', fontSize: '0.95rem' }}>
                View Our Complete Gallery
              </a>
            </div>
          </div>
        </div>
      </section>




      {/* ═══ CATEGORIES ═══ */}
      <section id="categories" className={`section ${styles.categoriesSection}`}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Shop by Category</span>
            <h2 className="section-title">Our <span>Collections</span></h2>
            <p className="section-subtitle">From formal suits to regal sherwanis — every category comes with full customization.</p>
          </div>
          <div className={styles.categoriesGrid}>
            {CATEGORIES.map(cat => {
              const openCategory = () => {
                const matchingProducts = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase());
                
                // Deduplicate swatches by swatch image URL
                const swatchMap = new Map();
                matchingProducts.forEach(p => {
                  p.fabricSwatches?.forEach(sw => {
                    swatchMap.set(sw.image, sw);
                  });
                });
                const swatches = Array.from(swatchMap.values());

                // Find dynamic sketch or fallback
                const sketch = matchingProducts.find(p => p.sketchImage)?.sketchImage || SKETCH_MAP[cat.name] || undefined;

                // Collect category hero image + matching product images as alternative views
                const categoryImages = [
                  cat.image,
                  ...matchingProducts.flatMap(p => [p.image, p.imageFav]).filter(Boolean)
                ] as string[];
                const uniqueImages = Array.from(new Set(categoryImages));

                setSelectedProduct({
                  id: cat.id,
                  name: cat.name,
                  category: cat.name,
                  price: 0,
                  image: cat.image,
                  fabricSwatches: swatches,
                  sketchImage: sketch,
                  images: uniqueImages,
                });
              };
              return (
              <div key={cat.id} className={styles.categoryCard}
                onClick={openCategory}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && openCategory()}
              >
                <div className={styles.categoryImage}>
                  <Image src={cat.image} alt={`Custom-tailored ${cat.name} in Visakhapatnam - Madhu Textorium`} fill sizes="(max-width: 480px) 50vw, (max-width: 1024px) 25vw, 25vw" style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }} />
                  <div className={styles.categoryOverlay} />
                </div>
                <div className={styles.categoryInfo}>
                  <h3 className={styles.categoryName}>{cat.name}</h3>
                  <p className={styles.categoryDesc}>{cat.desc}</p>
                  <span className={styles.customFitBadge}>
                    <FiScissors size={11} /> Custom Fit Available
                  </span>
                  <button className={styles.exploreBtn}>
                    Explore <FiArrowRight size={12} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TOP SELLERS ═══ */}
      <section className={`section ${styles.topSellersSection}`}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Best Sellers</span>
            <h2 className="section-title">Customer <span>Favourites</span></h2>
          </div>
          <div className={styles.topSellersGrid}>
            {topSellers.map(product => {
              const favImg = (product as Product & { imageFav?: string }).imageFav || product.image;
              const openModal = () => setSelectedProduct({
                ...product,
                image: favImg,
                images: [product.image, product.imageFav].filter(Boolean) as string[],
              });
              return (
              <div key={product.id} className={styles.topSellerCard} role="button" tabIndex={0}
                onClick={openModal}
                onKeyDown={e => e.key === 'Enter' && openModal()}>
                <div className={styles.topSellerImage}>
                  {favImg ? (
                    <Image
                      src={favImg}
                      alt={`Bespoke ${product.name} wedding menswear in Visakhapatnam - Madhu Textorium`}
                      fill
                      sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                  ) : (
                    <div className="product-placeholder">
                      <GiTie size={48} className="product-placeholder-icon" />
                      <span className="product-placeholder-text">{product.category}</span>
                    </div>
                  )}
                  <span className={styles.topSellerBadge}>Top Seller</span>
                </div>
                <div className={styles.topSellerInfo}>
                  <p className={styles.topSellerCategory}>{product.category}</p>
                  <h3 className={styles.topSellerName}>{product.name}</h3>
                  <div className={styles.topSellerFooter}>
                    <button
                      className={styles.viewDetailsBtnInline}
                      onClick={e => { e.stopPropagation(); openModal(); }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* ═══ ABOUT ═══ */}
      <section id="about" className={`section ${styles.aboutSection}`}>
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutImage}>
              <div className={styles.aboutImageWrap}>
                <Image src={`${R2}/images/about-measurement.png`} alt="Bespoke men's tailoring measurement guide in Vizag - Madhu Textorium" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
                <div className={styles.aboutImageOverlay} />
              </div>
              <div className={styles.aboutBadge}>
                <FiAward size={18} />
                <span>Premium Quality</span>
              </div>
            </div>
            <div className={styles.aboutContent}>
              <span className="section-label">Our Philosophy</span>
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 14 }}>
                We Believe in <span>Custom Clothes</span>
              </h2>
              <p className={styles.aboutText}>
                At Madhu Textorium, clothing is more than fabric — it is an expression of your identity,
                confidence, and grace. For over a decade, we have crafted garments that fit not just
                your body, but your personality.
              </p>
              <p className={styles.aboutText}>
                Our master tailors bring decades of expertise in traditional Indian menswear — from royal
                sherwanis and Jodhpuri suits to modern executive blazers — using premium fabrics from the finest mills.
              </p>
              <div className={styles.aboutPoints}>
                {['Hand-selected premium fabrics', 'Master tailors with 20+ years experience', 'Perfect fit or free re-stitching', 'Traditional meets modern design'].map((pt, i) => (
                  <div key={i} className={styles.aboutPoint}>
                    <FiCheck className={styles.aboutCheck} />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
              <div className={styles.aboutActions}>
                <Link href="/customize" className="btn btn-primary"><FiScissors size={14} /> Book Customization</Link>
                <a href={waLink('Hello! I want to know more about Madhu Textorium.')} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <FaWhatsapp size={15} /> Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section id="reviews" className={`section ${styles.reviewsSection}`}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Reviews</span>
            <h2 className="section-title">What Our <span>Customers Say</span></h2>
          </div>
          <div className={styles.reviewsSlider}>
            <button className={styles.reviewNav} onClick={prevReview} aria-label="Previous review"><FiChevronLeft size={20} /></button>
            <div className={styles.reviewCard}>
              <FaQuoteLeft className={styles.reviewQuote} size={28} />
              <div className="stars">
                {Array.from({ length: REVIEWS[reviewIdx].stars }).map((_, i) => <FaStar key={i} />)}
              </div>
              <p className={styles.reviewText}>&ldquo;{REVIEWS[reviewIdx].review}&rdquo;</p>
              <div className={styles.reviewAuthor}>
                <div className={styles.reviewAvatar}>{REVIEWS[reviewIdx].initials}</div>
                <div>
                  <p className={styles.reviewName}>{REVIEWS[reviewIdx].name}</p>
                  <p className={styles.reviewRole}>{REVIEWS[reviewIdx].role}</p>
                </div>
              </div>
            </div>
            <button className={styles.reviewNav} onClick={nextReview} aria-label="Next review"><FiChevronRight size={20} /></button>
          </div>
          <div className={styles.reviewDots}>
            {REVIEWS.map((_, i) => (
              <button key={i} className={`${styles.reviewDot} ${i === reviewIdx ? styles.reviewDotActive : ''}`}
                onClick={() => { resetReviewTimer(); setReviewIdx(i); }} aria-label={`Review ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className={`section ${styles.contactSection}`}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Get In Touch</span>
            <h2 className="section-title">Visit or <span>Contact Us</span></h2>
            <p className="section-subtitle">Drop by our store in Visakhapatnam or reach us instantly on WhatsApp.</p>
          </div>
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <div className={styles.contactCard}>
                <div className={styles.contactIconWrap}><FiMapPin size={20} /></div>
                <div>
                  <h4 className={styles.contactCardTitle}>Our Store</h4>
                  <p className={styles.contactCardText}>Door No 27-4-30, Beside Super Bazar,<br />Main Road, Poorna Market,<br />Visakhapatnam – 530002, Andhra Pradesh</p>
                </div>
              </div>
              <div className={styles.contactCard}>
                <div className={styles.contactIconWrap}><FiPhone size={20} /></div>
                <div>
                  <h4 className={styles.contactCardTitle}>Call Us</h4>
                  <a href="tel:+919030727629" className={styles.contactPhone}>+91 90307 27629</a>
                  <a href="tel:+919441866018" className={styles.contactPhone}>+91 94418 66018</a>
                </div>
              </div>
              <div className={styles.contactCard}>
                <div className={styles.contactIconWrap} style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)' }}>
                  <FaWhatsapp size={20} />
                </div>
                <div>
                  <h4 className={styles.contactCardTitle}>WhatsApp Enquiry</h4>
                  <p className={styles.contactCardText}>Send measurements, customization requirements, or any queries directly on WhatsApp.</p>
                  <a href={waLink("Hello Madhu Textorium! I'd like to make an enquiry.")} target="_blank" rel="noopener noreferrer"
                    className="btn btn-whatsapp" style={{ marginTop: 14 }}>
                    <FaWhatsapp size={17} /> Chat on WhatsApp
                  </a>
                </div>
              </div>
              <div className={styles.contactCard}>
                <div className={styles.contactIconWrap}><FiSmartphone size={20} /></div>
                <div>
                  <h4 className={styles.contactCardTitle}>Business Hours</h4>
                  <p className={styles.contactCardText}>Monday – Saturday: 10:00 AM – 9:00 PM<br />Sunday: 3:00 PM – 9:00 PM</p>
                </div>
              </div>
            </div>
            <div className={styles.mapWrap}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3800.617867399296!2d83.29652!3d17.72197!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a39433b0df30693%3A0x8daee6f7fb8f69d0!2sPoorna%20Market%2C%20Visakhapatnam%2C%20Andhra%20Pradesh%20530001!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%" height="100%"
                style={{ border: 0, borderRadius: 16, minHeight: 440 }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Madhu Textorium – Poorna Market, Visakhapatnam"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ SECTION (SEO & USER GUIDE) ═══ */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">FAQ &amp; Guide</span>
            <h2 className="section-title">Bespoke <span>Men Outfits Vizag</span></h2>
            <p className="section-subtitle">Common questions regarding men clothing customization, groom styles, and traditional attire.</p>
          </div>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Where is Madhu Textorium located and what do you offer?</h3>
              <p className={styles.faqAnswer}>
                <strong>Madhu Textorium</strong> (often searched as <strong>Madhu Textarium</strong> or <strong>Madhu Textorian</strong>) is premium custom tailors house located in Poorna Market, Visakhapatnam. We offer high-quality <strong>men clothing</strong> fabric and custom stitching services for all categories of premium menswear.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can I order custom groom wedding sherwanis and suits in Vizag?</h3>
              <p className={styles.faqAnswer}>
                Yes! We specialize in premium groom wear, designer wedding <strong>sherwanis in Vizag</strong>, three-piece executive suits, and royal Jodhpuri suits. Our master tailors ensure that every piece is crafted to your exact custom specifications.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What choices are available for men traditional attire, Mehendi, or reception?</h3>
              <p className={styles.faqAnswer}>
                We cater to all wedding functions: elegant <strong>men Mehendi outfits</strong> (like Modi coat and Kurta pyjama sets), regal <strong>marriage outfits</strong> (Sherwani, Indo-Western ensembles), and modern <strong>reception outfits</strong> (suits, blazers, and trousers). Choose from premium fabric options and custom styles.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How does customization of garments work on your website?</h3>
              <p className={styles.faqAnswer}>
                Our interactive customizer allows step-by-step <strong>customization of Sherwani</strong>, <strong>customization of shirt</strong>, <strong>customization of suits</strong>, <strong>customization of Pants</strong>, <strong>customization of Blazers</strong>, and <strong>customization of Kurta</strong>. Simply enter your measurements, pick your style details, and submit to launch a direct WhatsApp discussion.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Do you accept custom tailoring orders from outside Visakhapatnam?</h3>
              <p className={styles.faqAnswer}>
                Absolutely. While we are Visakhapatnam&apos;s leading local tailor store, we accept custom orders from all corners of India and worldwide. Submit your measurements online, and we will stitch and ship the final garments directly to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={styles.footer}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0' }}>
          <div className={styles.footerLogo} style={{ margin: 0 }}>
            <Image src={`${R2}/images/logo.png`} alt="Madhu Textorium Logo" width={56} height={56}
              style={{ borderRadius: '50%', border: '2px solid var(--accent)', background: '#000', flexShrink: 0 }} />
            <div>
              <p className={styles.footerBrandName}>Madhu Textorium</p>
              <p className={styles.footerBrandTag}>Suitings &amp; Shirtings</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a href={waLink("Hello! I'd like to make an enquiry at Madhu Textorium.")} target="_blank" rel="noopener noreferrer"
        className="whatsapp-float" aria-label="Chat on WhatsApp">
        <FaWhatsapp />
      </a>
    </main>
  );
}
