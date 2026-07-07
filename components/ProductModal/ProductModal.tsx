'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiX, FiScissors, FiCheck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { MdColorLens, MdStraighten, MdStar } from 'react-icons/md';
import { GiSewingNeedle, GiClothes } from 'react-icons/gi';
import { useCart } from '@/context/CartContext';
import FabricLightbox from '@/components/FabricLightbox/FabricLightbox';
import styles from './ProductModal.module.css';

export interface FabricSwatch {
  id: string;
  name: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  imageFav?: string;
  description?: string;
  colors?: string[];
  fabrics?: string[];
  features?: string[];
  isTopSeller?: boolean;
  fabricSwatches?: FabricSwatch[];
  sketchImage?: string;
}

interface Props {
  product: Product | null;
  onClose: () => void;
}

const WHATSAPP_NUMBER = '919030727629';

const DEFAULT_COLORS: Record<string, string[]> = {
  'Suits':     ['Charcoal Grey', 'Navy Blue', 'Black', 'Ivory White', 'Dark Brown', 'Midnight Blue'],
  'Shirts':    ['White', 'Sky Blue', 'Light Grey', 'Cream', 'Pale Yellow', 'Mint Green', 'Pink'],
  'Pants':     ['Charcoal', 'Navy', 'Black', 'Beige', 'Olive', 'Grey Melange'],
  'Modi Coat': ['Navy Blue', 'Black', 'Cream', 'Dark Green', 'Wine Red', 'Royal Blue'],
  'Jodhpuri':  ['Maroon', 'Navy Blue', 'Royal Blue', 'Champagne', 'Black', 'Burgundy'],
  'Sherwani':  ['Ivory Gold', 'Royal Maroon', 'Champagne', 'Deep Green', 'Off-White', 'Royal Blue'],
  'Blazers':   ['Navy', 'Charcoal', 'Black', 'Camel', 'Burgundy', 'Royal Blue'],
  'Kurta':     ['White', 'Ivory', 'Sky Blue', 'Cream', 'Sage Green', 'Dusty Pink'],
};

const DEFAULT_FABRICS   = ['Premium Wool', 'Cotton Blend', 'Poly-Viscose', 'Pure Cotton', 'Linen', 'Silk Blend'];
const DEFAULT_FEATURES  = [
  'Custom tailor measurements',
  'Premium quality stitching',
  'Choice of lining & interlining',
  'Button & thread colour selection',
  'Perfect fit or free re-stitch',
];

export default function ProductModal({ product, onClose }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  /* Which swatch is open in the lightbox (null = lightbox closed) */
  const [lightboxSwatch, setLightboxSwatch] = useState<FabricSwatch | null>(null);

  /* Reset lightbox whenever the product changes */
  useEffect(() => {
    setLightboxSwatch(null);
  }, [product?.id]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = product ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  /* ── Mobile back-button support via History API ──────────────────────────
   * DESIGN
   * ──────
   * We push ONE history entry when the modal opens.  The popstate handler
   * decides what to close (lightbox first, then modal).
   *
   * If the lightbox is closed via the back button we MUST re-push one entry
   * so pressing back again still closes the modal (not the whole page).  We
   * track the running push count so that closing via the ✕ button always
   * cleans up exactly the right number of entries with history.go(-count).
   *
   * Paths
   * ─────
   *  Back → (lightbox open)  → close lightbox, re-push 1, count stays same
   *  Back → (modal only)     → close modal, mark closedByBack, count → 0
   *  ✕ button → (any)        → cleanup calls history.go(-count) to clean stack
   */
  const historyPushCountRef = useRef(0);
  const closedByBackRef     = useRef(false);

  useEffect(() => {
    if (!product) return;

    closedByBackRef.current = false;
    window.history.pushState({ layer: 'modal' }, '');
    historyPushCountRef.current = 1;

    const handlePop = () => {
      setLightboxSwatch(current => {
        if (current !== null) {
          /* Lightbox was open.
           * Popstate consumed 1 entry (count: N → N-1).
           * Re-push 1 so the modal still has a back-button slot (count: N-1 → N).
           * Net effect: count unchanged, lightbox closed. */
          setTimeout(() => {
            window.history.pushState({ layer: 'modal' }, '');
          }, 0);
          return null;
        }

        /* Only modal was open – close it.
         * Popstate consumed the last entry; nothing left to clean up. */
        closedByBackRef.current = true;
        setTimeout(() => {
          onCloseRef.current();
        }, 0);
        return null;
      });
    };

    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      /* If the modal was closed by the ✕ button (not the back button),
       * we still have historyPushCountRef.current entries in the stack.
       * Go back by that many to leave the history clean. */
      if (!closedByBackRef.current && historyPushCountRef.current > 0) {
        window.history.go(-historyPushCountRef.current);
        historyPushCountRef.current = 0;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  /* ── Do NOT push a separate entry for the lightbox. ──────────────────────
   * The single modal entry handles both layers.  The re-push inside handlePop
   * above restores the modal's slot after the lightbox is back-navigated. */

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (lightboxSwatch) {
        setLightboxSwatch(null);   // close lightbox first
      } else {
        onClose();                 // then close modal
      }
    }
  }, [onClose, lightboxSwatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!product) return null;

  const colors    = product.colors   || DEFAULT_COLORS[product.category] || ['Navy Blue', 'Black', 'Charcoal'];
  const fabrics   = product.fabrics  || DEFAULT_FABRICS;
  const features  = product.features || DEFAULT_FEATURES;
  const swatches  = product.fabricSwatches || [];

  const waMsg = encodeURIComponent(
    `Hello Madhu Textorium! I'm interested in the *${product.name}* (${product.category}).\n\nCould you please share more details, fabric options, and pricing?\n\nThank you.`
  );

  const handleCustomizeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    closedByBackRef.current = true; // prevent cleanup go(-1)
    window.history.go(-1); // remove the modal history entry
    
    setTimeout(() => {
      router.push(`/customize?category=${product.category.toLowerCase().replace(/\s+/g, '-')}&product=${product.id}`);
      onClose();
    }, 50);
  };

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, category: product.category, price: product.price, quantity: 1 });
    onClose();
  };

  return (
    <>
      {/* ── Product modal backdrop ── */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* ── Product modal ── */}
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={product.name}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <FiX size={20} />
        </button>

        <div className={styles.body}>

          {/* ══ IMAGE SIDE ══ */}
          <div className={styles.imageSide}>
            <div className={styles.imageWrap}>
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <GiClothes size={64} style={{ color: 'var(--accent)', opacity: 0.35 }} />
                  <span className={styles.imagePlaceholderText}>{product.category}</span>
                </div>
              )}
            </div>

            {product.isTopSeller && (
              <div className={styles.sellerBadge}><MdStar size={14} /> Top Seller</div>
            )}

            {/* ── Clothes / Fabric swatch strip ── */}
            {swatches.length > 0 && (
              <div className={styles.fabricGallery}>
                <p className={styles.fabricGalleryLabel}>
                  Choose Fabric · Click to Preview Full Size
                </p>
                <div className={styles.fabricGalleryRow}>
                  {swatches.map(swatch => (
                    <button
                      key={swatch.id}
                      className={styles.fabricThumb}
                      onClick={() => setLightboxSwatch(swatch)}
                      title={`Preview ${swatch.name}`}
                      aria-label={`Open full preview of ${swatch.name}`}
                    >
                      <Image
                        src={swatch.image}
                        alt={swatch.name}
                        fill
                        sizes="64px"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className={styles.fabricThumbOverlay}>
                        <span className={styles.fabricThumbHint}>👁</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className={styles.fabricGalleryHint}>
                  Tap any fabric to open full-screen preview with garment try-on
                </p>
              </div>
            )}
          </div>

          {/* ══ INFO SIDE ══ */}
          <div className={styles.infoSide}>
            <div className={styles.categoryTag}>{product.category}</div>
            <h2 className={styles.productName}>{product.name}</h2>

            <p className={styles.description}>
              {product.description ||
                `Handcrafted ${product.name.toLowerCase()} — made to your exact measurements by our master tailors. Premium fabric, precise stitching, flawless finish guaranteed.`}
            </p>

            {/* Colours */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <MdColorLens size={16} style={{ color: 'var(--accent)' }} />
                Available Colours
              </div>
              <div className={styles.colorGrid}>
                {colors.map(c => <span key={c} className={styles.colorChip}>{c}</span>)}
              </div>
            </div>

            {/* Fabrics */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <GiSewingNeedle size={16} style={{ color: 'var(--accent)' }} />
                Fabric Options
              </div>
              <div className={styles.fabricRow}>
                {fabrics.map(f => <span key={f} className={styles.fabricChip}>{f}</span>)}
              </div>
            </div>

            {/* Features */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <MdStraighten size={16} style={{ color: 'var(--accent)' }} />
                What&apos;s Included
              </div>
              <ul className={styles.featureList}>
                {features.map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <FiCheck size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                onClick={handleCustomizeClick}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <FiScissors size={15} /> Customize &amp; Order
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <FaWhatsapp size={17} /> WhatsApp Enquiry
              </a>
            </div>
            <button className={styles.addCartBtn} onClick={handleAddToCart}>
              Add to Cart for Later
            </button>
          </div>
        </div>
      </div>

      {/* ── Fabric lightbox — completely independent popup above modal ── */}
      {lightboxSwatch && (
        <FabricLightbox
          fabric={lightboxSwatch}
          sketchImage={product.sketchImage}
          garmentName={product.category}
          onClose={() => setLightboxSwatch(null)}
        />
      )}
    </>
  );
}
