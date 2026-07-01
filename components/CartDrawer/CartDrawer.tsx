'use client';

import { useCart } from '@/context/CartContext';
import { FiX, FiPlus, FiMinus, FiShoppingBag, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Image from 'next/image';
import styles from './CartDrawer.module.css';

const WHATSAPP_NUMBER = '919030727629';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, totalItems } = useCart();

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatCartMessage = () => {
    let msg = `🛍️ *ORDER ENQUIRY - Madhu Textorium*\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📦 *Items Ordered:*\n\n`;
    items.forEach((item, i) => {
      msg += `${i + 1}. *${item.name}*\n`;
      msg += `   Category: ${item.category}\n`;
      msg += `   Quantity: ${item.quantity}\n`;
      if (item.price > 0) msg += `   Price: ₹${(item.price * item.quantity).toLocaleString()}\n`;
      msg += `\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    if (totalPrice > 0) msg += `💰 *Total: ₹${totalPrice.toLocaleString()}*\n\n`;
    msg += `📍 Please confirm availability and customization options.\n`;
    msg += `📞 Enquiring via website - Madhu Textorium`;
    return encodeURIComponent(msg);
  };

  const sendToWhatsApp = () => {
    if (items.length === 0) return;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${formatCartMessage()}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <FiShoppingBag size={20} style={{ color: 'var(--gold)' }} />
            <span className={styles.headerTitle}>Your Cart</span>
            {totalItems > 0 && (
              <span className={styles.badge}>{totalItems}</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close cart">
            <FiX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <FiShoppingBag size={56} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <p className={styles.emptyTitle}>Your cart is empty</p>
              <p className={styles.emptySubtitle}>Add items to enquire via WhatsApp</p>
              <button className="btn btn-outline" onClick={() => setIsOpen(false)}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {items.map(item => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={70} height={90} style={{ objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div className={styles.itemPlaceholder}>
                        <FiShoppingBag size={20} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemCategory}>{item.category}</p>
                    {item.price > 0 && (
                      <p className={styles.itemPrice}>₹{item.price.toLocaleString()}</p>
                    )}
                    <div className={styles.qtyControls}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.footer}>
            {totalPrice > 0 && (
              <div className={styles.total}>
                <span>Estimated Total</span>
                <span className={styles.totalAmount}>₹{totalPrice.toLocaleString()}</span>
              </div>
            )}
            <button className={`btn btn-whatsapp ${styles.whatsappBtn}`} onClick={sendToWhatsApp}>
              <FaWhatsapp size={20} />
              Send Enquiry via WhatsApp
            </button>
            <button
              className={styles.clearBtn}
              onClick={clearCart}
            >
              <FiTrash2 size={14} />
              Clear Cart
            </button>
            <p className={styles.disclaimer}>
              Our team will confirm availability & pricing on WhatsApp.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
