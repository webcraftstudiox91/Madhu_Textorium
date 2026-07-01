'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FiX, FiScissors, FiCheck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { MdColorLens, MdStraighten, MdStar } from 'react-icons/md';
import { GiSewingNeedle, GiClothes } from 'react-icons/gi';
import { useCart } from '@/context/CartContext';
import styles from './ProductModal.module.css';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  description?: string;
  colors?: string[];
  fabrics?: string[];
  features?: string[];
  isTopSeller?: boolean;
}

interface Props {
  product: Product | null;
  onClose: () => void;
}

const WHATSAPP_NUMBER = '919030727629';

const DEFAULT_COLORS: Record<string, string[]> = {
  'Suits': ['Charcoal Grey', 'Navy Blue', 'Black', 'Ivory White', 'Dark Brown', 'Midnight Blue'],
  'Shirts': ['White', 'Sky Blue', 'Light Grey', 'Cream', 'Pale Yellow', 'Mint Green', 'Pink'],
  'Pants': ['Charcoal', 'Navy', 'Black', 'Beige', 'Olive', 'Grey Melange'],
  'Modi Coat': ['Navy Blue', 'Black', 'Cream', 'Dark Green', 'Wine Red', 'Royal Blue'],
  'Jodhpuri': ['Maroon', 'Navy Blue', 'Royal Blue', 'Champagne', 'Black', 'Burgundy'],
  'Sherwani': ['Ivory Gold', 'Royal Maroon', 'Champagne', 'Deep Green', 'Off-White', 'Royal Blue'],
  'Blazers': ['Navy', 'Charcoal', 'Black', 'Camel', 'Burgundy', 'Royal Blue'],
  'Kurta': ['White', 'Ivory', 'Sky Blue', 'Cream', 'Sage Green', 'Dusty Pink'],
};

const DEFAULT_FABRICS = ['Premium Wool', 'Cotton Blend', 'Poly-Viscose', 'Pure Cotton', 'Linen', 'Silk Blend'];

const DEFAULT_FEATURES = [
  'Custom tailor measurements',
  'Premium quality stitching',
  'Choice of lining & interlining',
  'Button & thread colour selection',
  'Perfect fit or free re-stitch',
];

export default function ProductModal({ product, onClose }: Props) {
  const { addItem } = useCart();

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!product) return null;

  const colors = product.colors || DEFAULT_COLORS[product.category] || ['Navy Blue', 'Black', 'Charcoal'];
  const fabrics = product.fabrics || DEFAULT_FABRICS;
  const features = product.features || DEFAULT_FEATURES;

  const waMsg = encodeURIComponent(
    `Hello Madhu Textorium! I'm interested in the *${product.name}* (${product.category}).\n\nCould you please share more details, fabric options, and pricing?\n\nThank you.`
  );

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, category: product.category, price: product.price, quantity: 1 });
    onClose();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={product.name}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <FiX size={20} />
        </button>

        <div className={styles.body}>
          {/* Image side */}
          <div className={styles.imageSide}>
            <div className={styles.imageWrap}>
              <div className={styles.imagePlaceholder}>
                <GiClothes size={64} style={{ color: 'var(--accent)', opacity: 0.35 }} />
                <span className={styles.imagePlaceholderText}>{product.category}</span>
              </div>
            </div>
            {product.isTopSeller && (
              <div className={styles.sellerBadge}>
                <MdStar size={14} /> Top Seller
              </div>
            )}
          </div>

          {/* Info side */}
          <div className={styles.infoSide}>
            <div className={styles.categoryTag}>{product.category}</div>
            <h2 className={styles.productName}>{product.name}</h2>

            {product.price > 0 && (
              <div className={styles.priceRow}>
                <span className={styles.price}>₹{product.price.toLocaleString()}</span>
                <span className={styles.priceNote}>Starting price · Custom fit included</span>
              </div>
            )}

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
                {colors.map(c => (
                  <span key={c} className={styles.colorChip}>{c}</span>
                ))}
              </div>
            </div>

            {/* Fabrics */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <GiSewingNeedle size={16} style={{ color: 'var(--accent)' }} />
                Fabric Options
              </div>
              <div className={styles.fabricRow}>
                {fabrics.map(f => (
                  <span key={f} className={styles.fabricChip}>{f}</span>
                ))}
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
              <Link
                href={`/customize?category=${product.category.toLowerCase().replace(/\s+/g, '-')}&product=${product.id}`}
                className="btn btn-primary"
                onClick={onClose}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <FiScissors size={15} />
                Customize & Order
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <FaWhatsapp size={17} />
                WhatsApp Enquiry
              </a>
            </div>
            <button
              className={styles.addCartBtn}
              onClick={handleAddToCart}
            >
              Add to Cart for Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
