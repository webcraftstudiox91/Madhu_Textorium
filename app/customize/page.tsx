'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import { FiArrowLeft, FiArrowRight, FiUpload, FiCheck, FiX, FiScissors, FiInfo, FiAlertCircle } from 'react-icons/fi';
import styles from './page.module.css';

// ─── GARMENT TYPES (using real product images) ───────────────────────────────
const GARMENT_TYPES = [
  { id: 'shirt',     label: 'Shirt',              image: '/images/real/shirts/shirts/IMG_20260702_134315.jpg.jpeg',        desc: 'Formal, casual, party wear' },
  { id: 'suit',      label: 'Suit',               image: '/images/real/suits/suits/IMG_20260702_130035.png.jpeg',          desc: '2-piece, 3-piece, slim fit' },
  { id: 'pant',      label: 'Pant / Trouser',     image: '/images/real/pants/pants/IMG_20260702_134436.png.jpeg',          desc: 'Formal, chinos, pleated' },
  { id: 'modi-coat', label: 'Modi Coat',          image: '/images/real/modi-coat/modi-coat/IMG_20260702_130607.png.jpeg',  desc: 'Classic Indian formal' },
  { id: 'jodhpuri',  label: 'Jodhpuri Suit',      image: '/images/real/jodhpuri/jodhpuri/IMG_20260702_125452.png.jpeg',    desc: 'Royal traditional wear' },
  { id: 'sherwani',  label: 'Sherwani',           image: '/images/real/sherwani/sherwani/IMG_20260702_125913.png.jpeg',    desc: 'Wedding & ceremonies' },
  { id: 'blazer',    label: 'Blazer',             image: '/images/real/blazers/blazers/IMG_20260702_130317.png.jpeg',      desc: 'Casual, formal, events' },
  { id: 'kurta',     label: 'Kurta / Kurta Pajama', image: '/images/real/kurta/kurta/IMG_20260702_130159.png.jpeg',       desc: 'Festive, ethnic, casual' },
];

// ─── FABRIC & COLOUR OPTIONS ────────────────────────────────────────────────
const FABRIC_OPTIONS = [
  'Wool Suiting', 'Polyester Blend', 'Cotton Linen', 'Silk Blend',
  'Terylene', 'Raymond Fabric', 'Arvind Fabric', 'Pure Cotton',
  'Rayon', 'Premium Georgette', 'Let owner decide',
];

const COLOR_PALETTE = [
  'Navy Blue', 'Charcoal Grey', 'Black', 'Ivory White', 'Cream',
  'Royal Blue', 'Maroon', 'Dark Green', 'Brown', 'Beige',
  'Wine Red', 'Off White', 'Sky Blue', 'Golden', 'Custom (describe below)',
];

// ─── MEASUREMENT TYPES ───────────────────────────────────────────────────────
interface Measurements {
  height: string; weight: string;
  chest: string; shoulder: string; sleeveLength: string; neck: string;
  waist: string; hips: string; inseam: string; thigh: string;
  shirtLength: string; coatLength: string; seatWidth: string;
}

interface MeasurementField {
  key: keyof Measurements;
  label: string;
  placeholder: string;
  unit: string;
  required: boolean;
  hint?: string;
}

interface MeasurementSection {
  title: string;
  fields: MeasurementField[];
}

// ─── GARMENT-SPECIFIC MEASUREMENT CONFIGS ───────────────────────────────────
const GARMENT_MEASUREMENTS: Record<string, MeasurementSection[]> = {
  shirt: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72', unit: 'kg', required: false },
    ]},
    { title: 'Upper Body', fields: [
      { key: 'chest',        label: 'Chest Circumference', placeholder: '40', unit: 'in', required: true,  hint: 'Measure fullest part of chest' },
      { key: 'shoulder',     label: 'Shoulder Width',      placeholder: '17', unit: 'in', required: true,  hint: 'Shoulder seam to seam' },
      { key: 'sleeveLength', label: 'Sleeve Length',       placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'neck',         label: 'Neck Circumference',  placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shirtLength',  label: 'Shirt Length',        placeholder: '30', unit: 'in', required: true,  hint: 'Nape of neck to desired hem' },
    ]},
  ],
  suit: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Jacket / Upper Body', fields: [
      { key: 'chest',        label: 'Chest Circumference', placeholder: '40', unit: 'in', required: true,  hint: 'Fullest part of chest' },
      { key: 'shoulder',     label: 'Shoulder Width',      placeholder: '17', unit: 'in', required: true,  hint: 'Shoulder seam to seam' },
      { key: 'sleeveLength', label: 'Jacket Sleeve Length',placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'neck',         label: 'Neck',                placeholder: '15', unit: 'in', required: false, hint: 'Around base of neck' },
      { key: 'coatLength',   label: 'Jacket Length',       placeholder: '30', unit: 'in', required: true,  hint: 'Nape to desired jacket hem' },
    ]},
    { title: 'Trouser / Lower Body', fields: [
      { key: 'waist',    label: 'Waist',        placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'hips',     label: 'Hips / Seat',  placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'inseam',   label: 'Inseam Length',placeholder: '30', unit: 'in', required: true,  hint: 'Crotch to ankle' },
      { key: 'thigh',    label: 'Thigh',        placeholder: '22', unit: 'in', required: false, hint: 'Upper thigh circumference' },
      { key: 'seatWidth',label: 'Seat Width',   placeholder: '17', unit: 'in', required: false, hint: 'Across widest seat point' },
    ]},
  ],
  pant: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Lower Body', fields: [
      { key: 'waist',     label: 'Waist',          placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'hips',      label: 'Hips / Seat',    placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'inseam',    label: 'Inseam (Length)',placeholder: '30', unit: 'in', required: true,  hint: 'Crotch to ankle' },
      { key: 'thigh',     label: 'Thigh',          placeholder: '22', unit: 'in', required: true,  hint: 'Upper thigh circumference' },
      { key: 'seatWidth', label: 'Seat Width',     placeholder: '17', unit: 'in', required: false, hint: 'Across widest seat' },
    ]},
  ],
  'modi-coat': [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Upper Body', fields: [
      { key: 'chest',        label: 'Chest Circumference', placeholder: '40', unit: 'in', required: true,  hint: 'Fullest part of chest' },
      { key: 'shoulder',     label: 'Shoulder Width',      placeholder: '17', unit: 'in', required: true,  hint: 'Shoulder seam to seam' },
      { key: 'sleeveLength', label: 'Sleeve Length',       placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'neck',         label: 'Neck',                placeholder: '15', unit: 'in', required: false, hint: 'Around base of neck' },
      { key: 'coatLength',   label: 'Coat Length',         placeholder: '42', unit: 'in', required: true,  hint: 'Nape to desired coat hem' },
      { key: 'waist',        label: 'Waist',               placeholder: '34', unit: 'in', required: false, hint: 'Natural waistline' },
    ]},
  ],
  jodhpuri: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Jacket / Upper Body', fields: [
      { key: 'chest',        label: 'Chest Circumference', placeholder: '40', unit: 'in', required: true,  hint: 'Fullest part of chest' },
      { key: 'shoulder',     label: 'Shoulder Width',      placeholder: '17', unit: 'in', required: true,  hint: 'Shoulder seam to seam' },
      { key: 'sleeveLength', label: 'Sleeve Length',       placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'neck',         label: 'Neck',                placeholder: '15', unit: 'in', required: false, hint: 'Around base of neck' },
      { key: 'coatLength',   label: 'Jacket Length',       placeholder: '30', unit: 'in', required: true,  hint: 'Nape to desired jacket hem' },
    ]},
    { title: 'Trouser / Lower Body', fields: [
      { key: 'waist',     label: 'Waist',      placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'hips',      label: 'Hips',       placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'seatWidth', label: 'Seat Width', placeholder: '17', unit: 'in', required: true,  hint: 'Across widest seat' },
      { key: 'inseam',    label: 'Inseam',     placeholder: '30', unit: 'in', required: false, hint: 'Crotch to ankle' },
      { key: 'thigh',     label: 'Thigh',      placeholder: '22', unit: 'in', required: false, hint: 'Upper thigh circumference' },
    ]},
  ],
  sherwani: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Upper Body', fields: [
      { key: 'chest',        label: 'Chest Circumference',  placeholder: '40', unit: 'in', required: true,  hint: 'Fullest part of chest' },
      { key: 'shoulder',     label: 'Shoulder Width',       placeholder: '17', unit: 'in', required: true,  hint: 'Shoulder seam to seam' },
      { key: 'sleeveLength', label: 'Sleeve Length',        placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'neck',         label: 'Neck',                 placeholder: '15', unit: 'in', required: false, hint: 'Around base of neck' },
      { key: 'coatLength',   label: 'Sherwani Length',      placeholder: '48', unit: 'in', required: true,  hint: 'Nape to desired hem (usually below knee)' },
    ]},
    { title: 'Lower Body (Churidar / Salwar)', fields: [
      { key: 'waist',  label: 'Waist',            placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'hips',   label: 'Hips',             placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'inseam', label: 'Churidar Length',  placeholder: '38', unit: 'in', required: false, hint: 'Waist to ankle' },
    ]},
  ],
  blazer: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Upper Body', fields: [
      { key: 'chest',        label: 'Chest Circumference', placeholder: '40', unit: 'in', required: true,  hint: 'Fullest part of chest' },
      { key: 'shoulder',     label: 'Shoulder Width',      placeholder: '17', unit: 'in', required: true,  hint: 'Shoulder seam to seam' },
      { key: 'sleeveLength', label: 'Sleeve Length',       placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'coatLength',   label: 'Blazer Length',       placeholder: '30', unit: 'in', required: true,  hint: 'Nape to desired hem' },
      { key: 'neck',         label: 'Neck',                placeholder: '15', unit: 'in', required: false, hint: 'Around base of neck' },
      { key: 'waist',        label: 'Waist',               placeholder: '34', unit: 'in', required: false, hint: 'Natural waistline' },
    ]},
  ],
  kurta: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Upper Body', fields: [
      { key: 'chest',        label: 'Chest Circumference', placeholder: '40', unit: 'in', required: true,  hint: 'Fullest part of chest' },
      { key: 'shoulder',     label: 'Shoulder Width',      placeholder: '17', unit: 'in', required: true,  hint: 'Shoulder seam to seam' },
      { key: 'sleeveLength', label: 'Sleeve Length',       placeholder: '25', unit: 'in', required: false, hint: 'Shoulder to wrist (leave blank for 3/4 or sleeveless)' },
      { key: 'shirtLength',  label: 'Kurta Length',        placeholder: '42', unit: 'in', required: true,  hint: 'Nape of neck to desired hem' },
    ]},
    { title: 'Lower Body – Pajama / Salwar (Optional)', fields: [
      { key: 'waist',  label: 'Waist',          placeholder: '34', unit: 'in', required: false, hint: 'Natural waistline' },
      { key: 'inseam', label: 'Pajama Length',  placeholder: '38', unit: 'in', required: false, hint: 'Waist to ankle' },
    ]},
  ],
};

// ─── UPLOAD TYPES ────────────────────────────────────────────────────────────
interface UploadedImage {
  label: string;
  file: File | null;
  preview: string | null;
  url: string | null;
  uploading: boolean;
  error: string | null;
}

const WHATSAPP_NUMBER = '919030727629';
const CLOUDINARY_UPLOAD_PRESET = 'madhu_textorium';
const CLOUDINARY_CLOUD_NAME = 'dummycloud';

// ─── INNER PAGE COMPONENT ────────────────────────────────────────────────────
function CustomizePageInner() {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category') || '';

  const categoryToGarmentId = (cat: string): string => {
    const map: Record<string, string> = {
      suits: 'suit', suit: 'suit',
      shirts: 'shirt', shirt: 'shirt',
      pants: 'pant', pant: 'pant', trousers: 'pant',
      'modi-coat': 'modi-coat', 'modi coat': 'modi-coat',
      jodhpuri: 'jodhpuri', 'jodhpuri-suit': 'jodhpuri',
      sherwani: 'sherwani',
      blazers: 'blazer', blazer: 'blazer',
      kurta: 'kurta', 'kurta-pajama': 'kurta',
    };
    return map[cat.toLowerCase()] || cat;
  };

  const defaultGarment = rawCategory ? categoryToGarmentId(rawCategory) : '';
  const initialStep = defaultGarment ? 2 : 1;

  const [step, setStep] = useState(initialStep);
  const [garment, setGarment] = useState(defaultGarment);
  const [fabric, setFabric] = useState('');
  const [color, setColor] = useState('');
  const [measurements, setMeasurements] = useState<Measurements>({
    height: '', weight: '',
    chest: '', shoulder: '', sleeveLength: '', neck: '',
    waist: '', hips: '', inseam: '', thigh: '',
    shirtLength: '', coatLength: '', seatWidth: '',
  });
  const [images, setImages] = useState<UploadedImage[]>([
    { label: 'Front View', file: null, preview: null, url: null, uploading: false, error: null },
    { label: 'Back View',  file: null, preview: null, url: null, uploading: false, error: null },
    { label: 'Side View',  file: null, preview: null, url: null, uploading: false, error: null },
  ]);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; fields: string[] } | null>(null);

  const fileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // ── Dismiss toast on timeout ─────────────────────────────────────────────
  const showToast = useCallback((message: string, fields: string[]) => {
    setToast({ message, fields });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Get required fields for current garment ──────────────────────────────
  const getRequiredFields = (): MeasurementField[] => {
    if (!garment) return [];
    const sections = GARMENT_MEASUREMENTS[garment] || [];
    return sections.flatMap(s => s.fields.filter(f => f.required));
  };

  const getMissingRequiredFields = (): MeasurementField[] => {
    return getRequiredFields().filter(f => !measurements[f.key]);
  };

  // ── Measurement handler ──────────────────────────────────────────────────
  const handleMeasurement = (key: keyof Measurements, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  // ── Image handlers ───────────────────────────────────────────────────────
  const handleImageSelect = (index: number, file: File) => {
    const preview = URL.createObjectURL(file);
    setImages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], file, preview, url: null, error: null };
      return updated;
    });
  };

  const uploadToCloudinary = async (file: File, label: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'madhu_textorium_orders');
    formData.append('public_id', `order_${Date.now()}_${label.replace(/\s/g, '_')}`);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST', body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.secure_url;
  };

  const handleUploadImages = async () => {
    setUploading(true);
    const updated = [...images];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].file && !updated[i].url) {
        updated[i] = { ...updated[i], uploading: true };
        setImages([...updated]);
        try {
          const url = await uploadToCloudinary(updated[i].file!, updated[i].label);
          updated[i] = { ...updated[i], url, uploading: false };
        } catch {
          updated[i] = { ...updated[i], uploading: false, error: 'Upload skipped – share on WhatsApp', url: 'PENDING_WHATSAPP' };
        }
        setImages([...updated]);
      }
    }
    setUploading(false);
  };

  // ── Build WhatsApp message ───────────────────────────────────────────────
  const buildWhatsAppMessage = (): string => {
    const selectedGarment = GARMENT_TYPES.find(g => g.id === garment);
    const missingFields = getMissingRequiredFields();

    let msg = `✂️ *CUSTOM ORDER ENQUIRY*\n`;
    msg += `*Madhu Textorium, Visakhapatnam*\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (customerName)  msg += `👤 *Customer:* ${customerName}\n`;
    if (customerPhone) msg += `📞 *Phone:* ${customerPhone}\n`;
    if (customerName || customerPhone) msg += `\n`;
    msg += `👔 *Garment:* ${selectedGarment?.label || garment}\n`;
    if (fabric) msg += `🧵 *Fabric:* ${fabric}\n`;
    if (color)  msg += `🎨 *Color:* ${color}\n\n`;

    // Measurements
    const sections = GARMENT_MEASUREMENTS[garment] || [];
    msg += `📏 *MEASUREMENTS:*\n━━━━━━━━━━━━━━━━━━━━\n`;
    sections.forEach(section => {
      const filled = section.fields.filter(f => measurements[f.key]);
      if (filled.length > 0) {
        msg += `\n*${section.title}:*\n`;
        filled.forEach(f => {
          const val = measurements[f.key];
          const unit = f.unit === 'cm' ? ' cm' : f.unit === 'kg' ? ' kg' : '"';
          msg += `• ${f.label}: ${val}${unit}\n`;
        });
      }
    });

    // Missing required measurements
    if (missingFields.length > 0) {
      msg += `\n⚠️ *MISSING REQUIRED MEASUREMENTS (Customer did not provide):*\n`;
      missingFields.forEach(f => {
        msg += `• ${f.label} (${f.unit})\n`;
      });
      msg += `_Please call customer to collect these before stitching._\n`;
    }

    // Photos
    msg += `\n📸 *BODY PHOTOS:*\n━━━━━━━━━━━━━━━━━━━━\n`;
    images.forEach(img => {
      if (img.url && img.url !== 'PENDING_WHATSAPP') {
        msg += `• ${img.label}: ${img.url}\n`;
      } else if (img.file) {
        msg += `• ${img.label}: [Photo will be shared in this chat]\n`;
      } else {
        msg += `• ${img.label}: Not provided\n`;
      }
    });

    if (notes) {
      msg += `\n📝 *SPECIAL INSTRUCTIONS:*\n━━━━━━━━━━━━━━━━━━━━\n${notes}\n`;
    }

    msg += `\n━━━━━━━━━━━━━━━━━━━━\n📍 Submitted via Madhu Textorium Website`;
    return encodeURIComponent(msg);
  };

  const handleSendToWhatsApp = async () => {
    await handleUploadImages();
    const msg = buildWhatsAppMessage();
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  // ── Validation & navigation ──────────────────────────────────────────────
  const handleProceedFromMeasurements = () => {
    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      showToast(
        `Please fill in the required measurements before proceeding:`,
        missing.map(f => f.label)
      );
      return;
    }
    setStep(3);
  };

  const canProceedStep1 = garment !== '';
  const isStep3Complete = images.some(img => img.file !== null);
  const activeSections = garment ? (GARMENT_MEASUREMENTS[garment] || []) : [];

  const steps = ['Garment', 'Measurements', 'Photos', 'Details', 'Review'];

  return (
    <main className={styles.page}>
      {/* Toast Notification */}
      {toast && (
        <div className={styles.toast}>
          <FiAlertCircle size={18} className={styles.toastIcon} />
          <div className={styles.toastBody}>
            <p className={styles.toastMessage}>{toast.message}</p>
            <ul className={styles.toastFields}>
              {toast.fields.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <button className={styles.toastClose} onClick={() => setToast(null)}>
            <FiX size={15} />
          </button>
        </div>
      )}

      {/* Back Link */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          <FiArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className={styles.pageTitle}>Custom Order</h1>
        <div className={styles.topBarRight} />
      </div>

      {/* Step Progress — NOT sticky */}
      <div className={styles.stepProgress}>
        <div className="container">
          <div className={styles.stepBar}>
            {steps.map((s, i) => (
              <div key={i} className={`${styles.stepItem} ${i + 1 === step ? styles.stepActive : ''} ${i + 1 < step ? styles.stepDone : ''}`}>
                <div className={styles.stepCircle}>
                  {i + 1 < step ? <FiCheck size={14} /> : <span>{i + 1}</span>}
                </div>
                <span className={styles.stepLabel}>{s}</span>
                {i < steps.length - 1 && <div className={`${styles.stepLine} ${i + 1 < step ? styles.stepLineDone : ''}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* ── STEP 1: Garment ── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Choose Your Garment</h2>
              <p className={styles.stepSubtitle}>Select the type of clothing you want custom-stitched</p>
            </div>
            <div className={styles.garmentGrid}>
              {GARMENT_TYPES.map(g => (
                <button
                  key={g.id}
                  className={`${styles.garmentCard} ${garment === g.id ? styles.garmentSelected : ''}`}
                  onClick={() => setGarment(g.id)}
                >
                  <div className={styles.garmentImageWrap}>
                    <Image
                      src={g.image}
                      alt={g.label}
                      fill
                      sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 12vw"
                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                  </div>
                  <span className={styles.garmentLabel}>{g.label}</span>
                  <span className={styles.garmentDesc}>{g.desc}</span>
                  {garment === g.id && <div className={styles.garmentCheck}><FiCheck size={14} /></div>}
                </button>
              ))}
            </div>
            <div className={styles.stepNav}>
              <div />
              <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Next: Measurements <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Measurements ── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Enter Your Measurements</h2>
              <p className={styles.stepSubtitle}>
                All measurements in <strong>inches</strong> unless noted.
                Fields marked <span className={styles.reqStar}>*</span> are required.
              </p>
            </div>

            {/* Pre-selected garment chip */}
            {garment && (
              <div className={styles.garmentChip}>
                <div className={styles.garmentChipImgWrap}>
                  <Image
                    src={GARMENT_TYPES.find(g => g.id === garment)?.image || ''}
                    alt={garment}
                    fill
                    sizes="40px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <span className={styles.garmentChipLabel}>
                  {GARMENT_TYPES.find(g => g.id === garment)?.label || garment}
                </span>
                <button className={styles.garmentChipChange} onClick={() => setStep(1)}>
                  Change
                </button>
              </div>
            )}

            <div className={styles.measureAlert}>
              <FiInfo size={16} />
              <span>
                Fill in what you know — our master tailor will contact you for any remaining measurements.
                Missing required fields will be noted in your WhatsApp enquiry.
              </span>
            </div>

            <div className={styles.measureGrid}>
              {activeSections.map((section) => (
                <div key={section.title} className={styles.measureSection}>
                  <h3 className={styles.measureSectionTitle}>{section.title}</h3>
                  <div className={styles.measureFields}>
                    {section.fields.map(field => (
                      <div key={field.key} className="form-group">
                        <label className="form-label">
                          {field.label}
                          {field.required && <span className={styles.reqStar}> *</span>}
                          <span className={styles.unitBadge}>{field.unit}</span>
                        </label>
                        <input
                          className="form-input"
                          type="number"
                          placeholder={`e.g. ${field.placeholder}`}
                          value={measurements[field.key]}
                          onChange={e => handleMeasurement(field.key, e.target.value)}
                        />
                        {field.hint && <p className={styles.fieldHint}>{field.hint}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.stepNav}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                <FiArrowLeft /> Back
              </button>
              <button className="btn btn-primary" onClick={handleProceedFromMeasurements}>
                Next: Upload Photos <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Photos ── */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Upload Body Photos</h2>
              <p className={styles.stepSubtitle}>
                Upload 3 photos — Front, Back, and Side profile — for the best custom fit.
                Stand straight in fitted clothing in good lighting.
              </p>
            </div>

            <div className={styles.photoGrid}>
              {images.map((img, i) => (
                <div key={i} className={styles.photoCard}>
                  <div
                    className={`${styles.photoDropZone} ${img.preview ? styles.photoHasImage : ''}`}
                    onClick={() => fileRefs[i].current?.click()}
                  >
                    {img.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.preview} alt={img.label} className={styles.photoPreview} />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <FiUpload size={32} style={{ color: 'var(--accent)', opacity: 0.7 }} />
                        <p className={styles.photoPlaceholderText}>Tap to upload</p>
                        <p className={styles.photoPlaceholderHint}>JPG, PNG · Max 10MB</p>
                      </div>
                    )}
                    {img.uploading && (
                      <div className={styles.photoUploading}>
                        <div className={styles.spinner} />
                        <span>Uploading...</span>
                      </div>
                    )}
                    {img.url && img.url !== 'PENDING_WHATSAPP' && (
                      <div className={styles.photoSuccess}><FiCheck size={20} /></div>
                    )}
                  </div>
                  <input
                    ref={fileRefs[i]}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleImageSelect(i, e.target.files[0])}
                  />
                  <div className={styles.photoLabel}>
                    <span className={styles.photoLabelText}>{img.label}</span>
                    {img.preview && (
                      <button className={styles.photoRemove} onClick={() => {
                        const updated = [...images];
                        updated[i] = { ...updated[i], file: null, preview: null, url: null, error: null };
                        setImages(updated);
                      }}>
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                  {img.error && <p className={styles.photoError}>{img.error}</p>}
                </div>
              ))}
            </div>

            <div className={styles.photoTip}>
              <FiInfo size={16} />
              <p>
                <strong>Photo Tips:</strong> Stand against a plain wall. Wear fitted clothing (not loose).
                Ensure your full body is visible. Good lighting is important.
                Cannot upload? Share photos directly on WhatsApp after submitting.
              </p>
            </div>

            <div className={styles.stepNav}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>
                <FiArrowLeft /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>
                {isStep3Complete ? 'Next: Add Details' : 'Skip for Now'}
                <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Details ── */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Fabric, Style & Details</h2>
              <p className={styles.stepSubtitle}>Help us understand your preferences to craft the perfect garment</p>
            </div>

            <div className={styles.detailsGrid}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input className="form-input" type="text" placeholder="Full name"
                  value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Your Phone Number</label>
                <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX"
                  value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fabric Preference</label>
                <select className="form-select" value={fabric} onChange={e => setFabric(e.target.value)}>
                  <option value="">Select fabric type...</option>
                  {FABRIC_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Color Preference</label>
                <select className="form-select" value={color} onChange={e => setColor(e.target.value)}>
                  <option value="">Select color...</option>
                  {COLOR_PALETTE.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Special Instructions / Design Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe any specific design elements, lining preferences, pocket styles, button types, embroidery, monogram, or any other customization..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ minHeight: 140 }}
                />
              </div>
            </div>

            <div className={styles.stepNav}>
              <button className="btn btn-outline" onClick={() => setStep(3)}>
                <FiArrowLeft /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(5)}>
                Review Order <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Review ── */}
        {step === 5 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Review & Send</h2>
              <p className={styles.stepSubtitle}>Review your order details below, then send to WhatsApp</p>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewSection}>
                <h3 className={styles.reviewSectionTitle}>Garment</h3>
                <p className={styles.reviewValue}>
                  {GARMENT_TYPES.find(g => g.id === garment)?.label}
                </p>
              </div>

              {(customerName || customerPhone) && (
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewSectionTitle}>Customer Info</h3>
                  {customerName  && <p className={styles.reviewValue}>{customerName}</p>}
                  {customerPhone && <p className={styles.reviewValue}>{customerPhone}</p>}
                </div>
              )}

              {(fabric || color) && (
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewSectionTitle}>Style</h3>
                  {fabric && <p className={styles.reviewValue}>Fabric: {fabric}</p>}
                  {color  && <p className={styles.reviewValue}>Color: {color}</p>}
                </div>
              )}

              <div className={styles.reviewSection}>
                <h3 className={styles.reviewSectionTitle}>Measurements</h3>
                <div className={styles.reviewMeasures}>
                  {Object.entries(measurements).filter(([, v]) => v !== '').map(([k, v]) => (
                    <div key={k} className={styles.reviewMeasureItem}>
                      <span>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                      <span className={styles.reviewMeasureVal}>{v}&quot;</span>
                    </div>
                  ))}
                  {Object.values(measurements).every(v => v === '') && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No measurements entered</p>
                  )}
                </div>
                {getMissingRequiredFields().length > 0 && (
                  <div className={styles.missingWarn}>
                    <FiAlertCircle size={14} />
                    <span>Missing required: {getMissingRequiredFields().map(f => f.label).join(', ')} — will be noted in enquiry</span>
                  </div>
                )}
              </div>

              <div className={styles.reviewSection}>
                <h3 className={styles.reviewSectionTitle}>Photos</h3>
                <div className={styles.reviewPhotos}>
                  {images.map((img, i) => (
                    <div key={i} className={styles.reviewPhoto}>
                      {img.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.preview} alt={img.label} className={styles.reviewPhotoImg} />
                      ) : (
                        <div className={styles.reviewPhotoEmpty}>No photo</div>
                      )}
                      <span className={styles.reviewPhotoLabel}>{img.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {notes && (
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewSectionTitle}>Special Instructions</h3>
                  <p className={styles.reviewValue}>{notes}</p>
                </div>
              )}
            </div>

            <div className={styles.waNotice}>
              <FaWhatsapp size={24} style={{ color: '#25D366', flexShrink: 0 }} />
              <p>
                Clicking &quot;Send to WhatsApp&quot; will open WhatsApp with all your order details pre-filled.
                If you have photos selected, they will be uploaded first (or you can share them directly in the chat).
              </p>
            </div>

            <div className={styles.stepNav}>
              <button className="btn btn-outline" onClick={() => setStep(4)}>
                <FiArrowLeft /> Back
              </button>
              <button
                className="btn btn-whatsapp"
                onClick={handleSendToWhatsApp}
                disabled={uploading || !garment}
                style={{ padding: '16px 40px', fontSize: '1rem' }}
              >
                {uploading ? (
                  <><div className={styles.spinner} /> Uploading Photos...</>
                ) : (
                  <><FaWhatsapp size={22} /> Send to WhatsApp Now</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--black)' }}>
        <div style={{ textAlign: 'center' }}>
          <FiScissors size={40} style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading...</p>
        </div>
      </div>
    }>
      <CustomizePageInner />
    </Suspense>
  );
}
