'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingBag, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Collections', href: '#categories' },
  { label: 'Products', href: '#products' },
  { label: 'Customize', href: '/customize' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const R2 = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '';

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={() => handleNavClick('#home')}>
          <div className={styles.logoIcon}>
            <Image
              src={`${R2}/images/logo.png`}
              alt="Madhu Textorium Logo"
              width={52}
              height={52}
              className={styles.logoImg}
            />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>Madhu Textorium</span>
            <span className={styles.logoTagline}>Suitings &amp; Shirtings</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className={styles.navLinks}>
          {navLinks.map(link => (
            <li key={link.label}>
              {link.href.startsWith('#') ? (
                <button className={styles.navLink} onClick={() => handleNavClick(link.href)}>
                  {link.label}
                </button>
              ) : (
                <Link href={link.href} className={styles.navLink}>{link.label}</Link>
              )}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Theme Toggle */}
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <FiSun size={17} /> : <FiMoon size={17} />}
            <span className={styles.themeBtnLabel}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Cart */}
          <button
            className={styles.cartBtn}
            onClick={() => setIsOpen(true)}
            aria-label="Open cart"
          >
            <FiShoppingBag size={19} />
            {totalItems > 0 && (
              <span className={styles.cartBadge}>{totalItems}</span>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            className={styles.menuBtn}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <FiX size={21} /> : <FiMenu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <ul className={styles.mobileLinks}>
          {navLinks.map(link => (
            <li key={link.label}>
              {link.href.startsWith('#') ? (
                <button className={styles.mobileLink} onClick={() => handleNavClick(link.href)}>
                  {link.label}
                </button>
              ) : (
                <Link href={link.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className={styles.mobileActions}>
          <button className={`${styles.themeBtn} ${styles.themeBtnFull}`} onClick={toggleTheme}>
            {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
          </button>
        </div>
      </div>
    </nav>
  );
}
