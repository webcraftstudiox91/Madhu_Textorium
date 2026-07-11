'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import { FiArrowLeft, FiArrowRight, FiUpload, FiCheck, FiX, FiScissors, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { createOrder, getFabricSwatchesByCategory, DbFabricSwatch } from '@/lib/queries';
import styles from './page.module.css';

// ─── Cloudflare R2 CDN base URL ───────────────────────────────────────────────
const R2 = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL ?? '';

// ─── GARMENT TYPES ────────────────────────────────────────────────────────────
const GARMENT_TYPES = [
  { id: 'shirt',        label: 'Shirt',                image: `${R2}/images/real/shirts/shirts/IMG_20260702_134315.jpg.jpeg`,       desc: 'Formal, casual, party wear' },
  { id: 'suit',         label: 'Suit',                 image: `${R2}/images/real/suits/suits/IMG_20260702_130035.png.jpeg`,         desc: '2-piece, 3-piece, slim fit' },
  { id: 'pant',         label: 'Pant / Trouser',       image: `${R2}/images/real/pants/pants/IMG_20260702_134436.png.jpeg`,         desc: 'Formal, chinos, pleated' },
  { id: 'modi-coat',    label: 'Modi Coat / Nehru',    image: `${R2}/images/real/modi-coat/modi-coat/IMG_20260702_130607.png.jpeg`, desc: 'Waist coat, Modi jacket' },
  { id: 'jodhpuri',     label: 'Jodhpuri Suit',        image: `${R2}/images/real/jodhpuri/jodhpuri/IMG_20260702_125452.png.jpeg`,   desc: 'Royal traditional wear' },
  { id: 'sherwani',     label: 'Sherwani',             image: `${R2}/images/real/sherwani/sherwani/IMG_20260702_125913.png.jpeg`,   desc: 'Wedding & ceremonies' },
  { id: 'blazer',       label: 'Blazer',               image: `${R2}/images/real/blazers/blazers/IMG_20260702_130317.png.jpeg`,     desc: 'Casual, formal, events' },
  { id: 'kurta',        label: 'Kurta / Kurta Pajama', image: `${R2}/images/real/kurta/kurta/IMG_20260702_130159.png.jpeg`,        desc: 'Festive, ethnic, casual' },
  { id: 'indo-western', label: 'Indo Western',         image: `${R2}/images/real/sherwani/sherwani/IMG_20260702_125913.png.jpeg`,   desc: '3-piece: Coat + Kurta + Pyjama' },
];

// ─── FABRIC & COLOUR OPTIONS ──────────────────────────────────────────────────
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

// ─── MEASUREMENT TYPES ────────────────────────────────────────────────────────
// Fields match the tailor's handwritten spec exactly.
interface Measurements {
  height: string; weight: string;
  // Upper body
  chest: string; stomach: string; shoulder: string; shoulderLength: string; sleeveLength: string; neck: string; bicep: string;
  // Garment lengths
  shirtLength: string; coatLength: string;
  waistcoatLength: string;  // for 3-piece suits
  kurtiLength: string;      // for modi-coat add-on kurti
  // Lower body
  waist: string; hips: string; thigh: string; knee: string; ankle: string; rise: string; inseam: string;
  pantLength: string; seatWidth: string;
}

// ─── STYLE OPTIONS ────────────────────────────────────────────────────────────
// Garment-specific style choices (cut, buttons, lapel, pocket, etc.)
interface StyleOptions {
  pantFinish: string;       // Straight | Formal Finish | Baggy | Boot Cut
  cutStyle: string;         // No Cut | 1 Cut | 2 Cut
  buttonCount: string;      // 1 Button | 2 Button | 4 Button | 6 Button
  lapelStyle: string;       // Plain Lapel | Tuxedo Lapel
  lapelColor: string;       // free text colour when Tuxedo Lapel
  pocketStyle: string;      // Pocket | No Pocket
  buttonPlacement: string;  // Inside | Outside
  splitStyle: string;       // Side Split | Standard
  pyjamaModel: string;      // Button Model | Hook Model
  pyjamaElastic: string;    // Back Elastic | No Elastic
  pantClosure: string;      // Hook | Button (pant waistband)
  buttonColor: string;      // free text button colour
}

interface StyleOptionGroup {
  label: string;
  key: keyof StyleOptions;
  options: string[];
  hint?: string;
  isText?: boolean;          // render a text input instead of chips
}

// ─── STYLE OPTION CONFIGS PER GARMENT ────────────────────────────────────────
const GARMENT_STYLE_OPTIONS: Record<string, StyleOptionGroup[]> = {
  // Shirt — Pocket choice added
  shirt: [
    { label: 'Pocket', key: 'pocketStyle', options: ['Pocket', 'No Pocket'] },
  ],
  // Pant — Finish + waistband closure
  pant: [
    { label: 'Pant Finish / Style', key: 'pantFinish',
      options: ['Straight', 'Formal Finish', 'Baggy', 'Boot Cut'] },
    { label: 'Waistband Closure', key: 'pantClosure',
      options: ['Hook', 'Button'],
      hint: 'Choose how the waistband fastens' },
  ],
  // Jodhpuri — removed lapels; buttons → Inside/Outside; + Button Colour
  jodhpuri: [
    { label: 'Cut Style',    key: 'cutStyle',       options: ['No Cut', '1 Cut', '2 Cut'] },
    { label: 'Buttons',      key: 'buttonPlacement', options: ['Inside', 'Outside'] },
    { label: 'Button Colour', key: 'buttonColor',   options: [], isText: true,
      hint: 'e.g. Gold, Black, Silver, Ivory...' },
  ],
  // Blazer — unchanged
  blazer: [
    { label: 'Cut Style',    key: 'cutStyle',     options: ['No Cut', '1 Cut', '2 Cut'] },
    { label: 'Buttons',      key: 'buttonCount',  options: ['1 Button', '2 Button', '4 Button', '6 Button'] },
    { label: 'Lapel Style',  key: 'lapelStyle',   options: ['Plain Lapel', 'Tuxedo Lapel'] },
    { label: 'Lapel Colour (if Tuxedo)', key: 'lapelColor', options: [], isText: true,
      hint: 'Specify colour for tuxedo lapel (e.g. Black, Ivory, Maroon)' },
  ],
  // Suit — unchanged style options (piece type handled separately in UI)
  suit: [
    { label: 'Cut Style',       key: 'cutStyle',     options: ['No Cut', '1 Cut', '2 Cut'] },
    { label: 'Buttons',         key: 'buttonCount',  options: ['1 Button', '2 Button', '4 Button', '6 Button'] },
    { label: 'Lapel Style',     key: 'lapelStyle',   options: ['Plain Lapel', 'Tuxedo Lapel'] },
    { label: 'Lapel Colour (if Tuxedo)', key: 'lapelColor', options: [], isText: true,
      hint: 'Specify colour for tuxedo lapel' },
    { label: 'Trouser Finish',  key: 'pantFinish',   options: ['Straight', 'Formal Finish', 'Baggy', 'Boot Cut'] },
  ],
  // Modi Coat — Buttons Inside/Outside + Button Colour
  'modi-coat': [
    { label: 'Buttons',       key: 'buttonPlacement', options: ['Inside', 'Outside'] },
    { label: 'Button Colour', key: 'buttonColor',    options: [], isText: true,
      hint: 'e.g. Gold, Black, Silver, Ivory...' },
  ],
  // Sherwani — removed Cut Style, Lapel, Button Count, Pyjama Finish; added Button Colour
  sherwani: [
    { label: 'Pocket',            key: 'pocketStyle',     options: ['Pocket', 'No Pocket'] },
    { label: 'Button Placement',  key: 'buttonPlacement', options: ['Inside', 'Outside'] },
    { label: 'Button Colour',     key: 'buttonColor',     options: [], isText: true,
      hint: 'e.g. Gold, Black, Silver, Ivory...' },
    { label: 'Side Split',        key: 'splitStyle',      options: ['Side Split', 'Standard'] },
    { label: 'Pyjama Waistband',  key: 'pyjamaElastic',   options: ['Back Elastic', 'No Elastic'],
      hint: 'Mention if back elastic will be added in pyjama' },
    { label: 'Pyjama Closure',    key: 'pyjamaModel',     options: ['Button Model', 'Hook Model'] },
  ],
  // Indo Western — removed Cut Style, Lapel, Buttons, Pyjama Finish
  'indo-western': [
    { label: 'Pocket',            key: 'pocketStyle',   options: ['Pocket', 'No Pocket'] },
    { label: 'Side Split',        key: 'splitStyle',    options: ['Side Split', 'Standard'] },
    { label: 'Pyjama Waistband',  key: 'pyjamaElastic', options: ['Back Elastic', 'No Elastic'],
      hint: 'Back elastic in pyjama waistband' },
    { label: 'Pyjama Closure',    key: 'pyjamaModel',   options: ['Button Model', 'Hook Model'] },
  ],
};

// ─── MEASUREMENT FIELD & SECTION TYPES ────────────────────────────────────────
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

// ─── GARMENT-SPECIFIC MEASUREMENT CONFIGS ─────────────────────────────────────
// Follows tailor's handwritten specification exactly.
const GARMENT_MEASUREMENTS: Record<string, MeasurementSection[]> = {

  // ① Shirt — Shirt Length, Hand Length, Chest, Stomach, Hips/Seat, Collar/Neck
  shirt: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Measurements', fields: [
      { key: 'shirtLength',    label: 'Shirt Length',    placeholder: '30', unit: 'in', required: true,  hint: 'Nape of neck to desired hem' },
      { key: 'sleeveLength',   label: 'Hand Length',     placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'chest',          label: 'Chest',           placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',        label: 'Stomach',         placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',           label: 'Hips / Seat',     placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',           label: 'Collar / Neck',   placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length', placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
    ]},
  ],

  // ② Pant — Length(custom), Waist, Hips/Seat, Thigh, Knee, Ankle, Rise(Kirtha), Inseam
  pant: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Measurements', fields: [
      { key: 'pantLength', label: 'Length (Custom)', placeholder: '42', unit: 'in', required: true,  hint: 'Waist to ankle (outseam)' },
      { key: 'waist',      label: 'Waist',           placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'hips',       label: 'Hips / Seat',     placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'thigh',      label: 'Thigh',           placeholder: '22', unit: 'in', required: true,  hint: 'Upper thigh circumference' },
      { key: 'knee',       label: 'Knee',            placeholder: '16', unit: 'in', required: true,  hint: 'Circumference around knee' },
      { key: 'ankle',      label: 'Ankle',           placeholder: '13', unit: 'in', required: true,  hint: 'Circumference around ankle' },
      { key: 'rise',       label: 'Rise / Kirtha',   placeholder: '11', unit: 'in', required: true,  hint: 'Waist to crotch and half value should be taken' },
      { key: 'inseam',     label: 'Inseam',          placeholder: '30', unit: 'in', required: false, hint: 'Crotch to ankle (inner seam)' },
    ]},
  ],

  // ③ Jodhpuri / Blazer — same upper body measurements; trouser same as Pant
  jodhpuri: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Jacket Measurements', fields: [
      { key: 'coatLength',     label: 'Length',          placeholder: '30', unit: 'in', required: true,  hint: 'Nape to desired jacket hem' },
      { key: 'sleeveLength',   label: 'Hand Length',      placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'chest',          label: 'Chest',            placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',        label: 'Stomach',          placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',           label: 'Hip / Seat',       placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',           label: 'Collar / Neck',    placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length',  placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
      { key: 'bicep',          label: 'Bicep',            placeholder: '14', unit: 'in', required: true,  hint: 'Upper arm circumference' },
    ]},
    { title: 'Trouser Measurements', fields: [
      { key: 'pantLength', label: 'Length (Custom)', placeholder: '42', unit: 'in', required: false, hint: 'Waist to ankle (outseam)' },
      { key: 'waist',      label: 'Waist',           placeholder: '34', unit: 'in', required: false, hint: 'Natural waistline' },
      { key: 'thigh',      label: 'Thigh',           placeholder: '22', unit: 'in', required: false, hint: 'Upper thigh circumference' },
      { key: 'knee',       label: 'Knee',            placeholder: '16', unit: 'in', required: false, hint: 'Circumference around knee' },
      { key: 'ankle',      label: 'Ankle',           placeholder: '13', unit: 'in', required: false, hint: 'Circumference around ankle' },
      { key: 'rise',       label: 'Rise / Kirtha',   placeholder: '11', unit: 'in', required: false, hint: 'Waist to crotch and half value should be taken' },
      { key: 'inseam',     label: 'Inseam',          placeholder: '30', unit: 'in', required: false, hint: 'Crotch to ankle (inner seam)' },
    ]},
  ],

  // Blazer — same upper body as Jodhpuri (no trouser section)
  blazer: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Measurements', fields: [
      { key: 'coatLength',     label: 'Length',           placeholder: '30', unit: 'in', required: true,  hint: 'Nape to desired blazer hem' },
      { key: 'sleeveLength',   label: 'Hand Length',       placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'chest',          label: 'Chest',             placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',        label: 'Stomach',           placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',           label: 'Hip / Seat',        placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',           label: 'Collar / Neck',     placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length',   placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
      { key: 'bicep',          label: 'Bicep',             placeholder: '14', unit: 'in', required: true,  hint: 'Upper arm circumference' },
    ]},
  ],

  // ④ Waist Coat / Modi Coat — Length, Chest, Stomach, Seat/Hip, Collar
  'modi-coat': [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Measurements', fields: [
      { key: 'coatLength',   label: 'Length',          placeholder: '42', unit: 'in', required: true,  hint: 'Nape to desired coat hem' },
      { key: 'chest',        label: 'Chest',           placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',      label: 'Stomach',         placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',         label: 'Seat / Hip',      placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',         label: 'Collar',          placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length', placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
    ]},
  ],

  // ⑤ Sherwani — Same as Jodhpuri/Blazer upper + Pyjama = same as Pant
  sherwani: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Sherwani Measurements', fields: [
      { key: 'coatLength',     label: 'Length',           placeholder: '48', unit: 'in', required: true,  hint: 'Nape to hem (usually below knee)' },
      { key: 'sleeveLength',   label: 'Hand Length',       placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'chest',          label: 'Chest',             placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',        label: 'Stomach',           placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',           label: 'Hip / Seat',        placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',           label: 'Collar / Neck',     placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length',   placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
      { key: 'bicep',          label: 'Bicep',             placeholder: '14', unit: 'in', required: true,  hint: 'Upper arm circumference' },
    ]},
    { title: 'Pyjama Measurements', fields: [
      { key: 'pantLength', label: 'Length (Custom)', placeholder: '42', unit: 'in', required: true,  hint: 'Waist to ankle (outseam)' },
      { key: 'waist',      label: 'Waist',           placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'thigh',      label: 'Thigh',           placeholder: '22', unit: 'in', required: false, hint: 'Upper thigh circumference' },
      { key: 'knee',       label: 'Knee',            placeholder: '16', unit: 'in', required: false, hint: 'Circumference around knee' },
      { key: 'ankle',      label: 'Ankle',           placeholder: '13', unit: 'in', required: false, hint: 'Circumference around ankle' },
      { key: 'rise',       label: 'Rise / Kirtha',   placeholder: '11', unit: 'in', required: false, hint: 'Waist to crotch and half value should be taken' },
      { key: 'inseam',     label: 'Inseam',          placeholder: '30', unit: 'in', required: false, hint: 'Crotch to ankle (inner seam)' },
    ]},
  ],

  // Kurta — same as Shirt upper + Pyjama same as Pant
  kurta: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Kurta Measurements', fields: [
      { key: 'shirtLength',    label: 'Kurta Length',    placeholder: '42', unit: 'in', required: true,  hint: 'Nape to desired hem' },
      { key: 'sleeveLength',   label: 'Hand Length',     placeholder: '25', unit: 'in', required: false, hint: 'Shoulder to wrist (leave blank for sleeveless/3-quarter)' },
      { key: 'chest',          label: 'Chest',           placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',        label: 'Stomach',         placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',           label: 'Hips / Seat',     placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',           label: 'Collar / Neck',   placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length', placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
    ]},
    { title: 'Pyjama / Salwar Measurements (Optional)', fields: [
      { key: 'pantLength', label: 'Length (Custom)', placeholder: '42', unit: 'in', required: false, hint: 'Waist to ankle' },
      { key: 'waist',      label: 'Waist',           placeholder: '34', unit: 'in', required: false, hint: 'Natural waistline' },
      { key: 'thigh',      label: 'Thigh',           placeholder: '22', unit: 'in', required: false, hint: 'Upper thigh circumference' },
      { key: 'knee',       label: 'Knee',            placeholder: '16', unit: 'in', required: false, hint: 'Circumference around knee' },
      { key: 'ankle',      label: 'Ankle',           placeholder: '13', unit: 'in', required: false, hint: 'Circumference around ankle' },
      { key: 'rise',       label: 'Rise / Kirtha',   placeholder: '11', unit: 'in', required: false, hint: 'Waist to crotch and half value should be taken' },
      { key: 'inseam',     label: 'Inseam',          placeholder: '30', unit: 'in', required: false, hint: 'Crotch to ankle (inner seam)' },
    ]},
  ],

  // Suit — Jacket (same as Jodhpuri) + Trouser (same as Pant)
  suit: [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Jacket Measurements', fields: [
      { key: 'coatLength',   label: 'Length',          placeholder: '30', unit: 'in', required: true,  hint: 'Nape to desired jacket hem' },
      { key: 'sleeveLength', label: 'Hand Length',      placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'chest',        label: 'Chest',            placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',      label: 'Stomach',          placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',         label: 'Hip / Seat',       placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',         label: 'Collar / Neck',    placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length', placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
      { key: 'bicep',        label: 'Bicep',            placeholder: '14', unit: 'in', required: false, hint: 'Upper arm circumference' },
    ]},
    { title: 'Trouser Measurements', fields: [
      { key: 'pantLength', label: 'Length (Custom)', placeholder: '42', unit: 'in', required: true,  hint: 'Waist to ankle (outseam)' },
      { key: 'waist',      label: 'Waist',           placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'thigh',      label: 'Thigh',           placeholder: '22', unit: 'in', required: false, hint: 'Upper thigh circumference' },
      { key: 'knee',       label: 'Knee',            placeholder: '16', unit: 'in', required: false, hint: 'Circumference around knee' },
      { key: 'ankle',      label: 'Ankle',           placeholder: '13', unit: 'in', required: false, hint: 'Circumference around ankle' },
      { key: 'rise',       label: 'Rise / Kirtha',   placeholder: '11', unit: 'in', required: false, hint: 'Waist to crotch and half value should be taken' },
      { key: 'inseam',     label: 'Inseam',          placeholder: '30', unit: 'in', required: false, hint: 'Crotch to ankle (inner seam)' },
    ]},
  ],

  // ⑥ Indo Western — 3 articles: Outside Open Coat + Kurta + Pyjama
  'indo-western': [
    { title: 'General (Optional)', fields: [
      { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', required: false },
      { key: 'weight', label: 'Weight', placeholder: '72',  unit: 'kg', required: false },
    ]},
    { title: 'Outside Open Coat (same as Sherwani)', fields: [
      { key: 'coatLength',     label: 'Coat Length',      placeholder: '48', unit: 'in', required: true,  hint: 'Nape to hem (usually below knee)' },
      { key: 'sleeveLength',   label: 'Hand Length',       placeholder: '25', unit: 'in', required: true,  hint: 'Shoulder to wrist' },
      { key: 'chest',          label: 'Chest',             placeholder: '40', unit: 'in', required: true,  hint: 'Full chest circumference' },
      { key: 'stomach',        label: 'Stomach',           placeholder: '36', unit: 'in', required: true,  hint: 'Around stomach / middle waist' },
      { key: 'hips',           label: 'Hip / Seat',        placeholder: '38', unit: 'in', required: true,  hint: 'Fullest part of seat' },
      { key: 'neck',           label: 'Collar / Neck',     placeholder: '15', unit: 'in', required: true,  hint: 'Around base of neck' },
      { key: 'shoulderLength', label: 'Shoulder Length',   placeholder: '18', unit: 'in', required: true,  hint: 'Across the back from shoulder point to shoulder point' },
      { key: 'bicep',          label: 'Bicep',             placeholder: '14', unit: 'in', required: false, hint: 'Upper arm circumference' },
    ]},
    { title: 'Kurta (same as Shirt)', fields: [
      { key: 'shirtLength', label: 'Kurta Length', placeholder: '36', unit: 'in', required: true,
        hint: 'Nape to kurta hem (inner garment — shorter than coat)' },
    ]},
    { title: 'Pyjama (same as Pant)', fields: [
      { key: 'pantLength', label: 'Length (Custom)', placeholder: '42', unit: 'in', required: true,  hint: 'Waist to ankle (outseam)' },
      { key: 'waist',      label: 'Waist',           placeholder: '34', unit: 'in', required: true,  hint: 'Natural waistline' },
      { key: 'thigh',      label: 'Thigh',           placeholder: '22', unit: 'in', required: false, hint: 'Upper thigh circumference' },
      { key: 'knee',       label: 'Knee',            placeholder: '16', unit: 'in', required: false, hint: 'Circumference around knee' },
      { key: 'ankle',      label: 'Ankle',           placeholder: '13', unit: 'in', required: false, hint: 'Circumference around ankle' },
      { key: 'rise',       label: 'Rise / Kirtha',   placeholder: '11', unit: 'in', required: false, hint: 'Waist to crotch and half value should be taken' },
      { key: 'inseam',     label: 'Inseam',          placeholder: '30', unit: 'in', required: false, hint: 'Crotch to ankle (inner seam)' },
    ]},
  ],
};

// ─── MEASUREMENT VISUAL GUIDES ───────────────────────────────────────────────
interface GuideData {
  title: string;
  image: string;
  description: string;
}

const MEASUREMENT_GUIDES: Record<string, GuideData> = {
  chest: {
    title: 'Chest Circumference',
    image: `${R2}/images/measurements/measure_chest.png.jpeg`,
    description: 'Stand straight with arms relaxed at your sides. Wrap the measuring tape horizontally around the fullest part of your chest, passing under the armpits. Keep the tape flat and snug, but not too tight. Do not include your arms.'
  },
  stomach: {
    title: 'Stomach / Abdomen',
    image: `${R2}/images/measurements/measure_stomach.png.jpeg`,
    description: 'Stand naturally without sucking in. Wrap the tape horizontally around your stomach/abdomen area (typically at the belly button level). Keep the tape parallel to the floor.'
  },
  neck: {
    title: 'Collar / Neck',
    image: `${R2}/images/measurements/measure_neck.png.jpeg`,
    description: 'Wrap the measuring tape around the base of your neck where a shirt collar would sit. Keep the tape snug but comfortable; place one finger between the tape and your neck for breathing room.'
  },
  sleeveLength: {
    title: 'Hand / Sleeve Length',
    image: `${R2}/images/measurements/measure_sleeve.png.jpeg`,
    description: 'Extend your arm straight out to the side horizontally. Measure from the shoulder seam point, straight along the outside top of the arm, down to your wrist bone.'
  },
  shirtLength: {
    title: 'Shirt Length',
    image: `${R2}/images/measurements/measure_length.png.jpeg`,
    description: 'Measure vertically from the nape of your neck (the bony bump at the base of your neck) straight down your spine to the desired length (hips for shirts).'
  },
  coatLength: {
    title: 'Coat / Blazer Length',
    image: `${R2}/images/measurements/measure_length.png.jpeg`,
    description: 'Measure vertically from the nape of your neck (the bony bump at the base of your neck) straight down your spine to the desired length (mid-thigh for blazers).'
  },
  pantLength: {
    title: 'Trouser / Pant Length',
    image: `${R2}/images/measurements/measure_pant_length.png.jpeg`,
    description: 'Measure vertically from your natural waistline down the outside of your leg (outseam) to your ankle bone or desired trouser length.'
  },
  waist: {
    title: 'Waist Circumference',
    image: `${R2}/images/measurements/measure_waist.png.jpeg`,
    description: 'Stand straight and wrap the measuring tape horizontally around your natural waistline (usually right above the belly button, where your trousers sit). Keep it snug but comfortable.'
  },
  hips: {
    title: 'Hips / Seat',
    image: `${R2}/images/measurements/measure_hips.png.jpeg`,
    description: 'Stand with your feet together. Wrap the measuring tape horizontally around the fullest part of your hips and seat.'
  },
  thigh: {
    title: 'Thigh Circumference',
    image: `${R2}/images/measurements/measure_thigh.png.jpeg`,
    description: 'Wrap the tape horizontally around the fullest part of your upper thigh, just below the crotch.'
  },
  knee: {
    title: 'Knee Circumference',
    image: `${R2}/images/measurements/measure_knee.png.jpeg`,
    description: 'Wrap the tape horizontally around your knee joint while standing straight.'
  },
  ankle: {
    title: 'Ankle / Bottom Circumference',
    image: `${R2}/images/measurements/measure_ankle.png.jpeg`,
    description: 'Wrap the tape horizontally around your ankle bone, where the trouser cuff will sit.'
  },
  rise: {
    title: 'Rise / Kirtha',
    image: `${R2}/images/measurements/measure_rise.png.jpeg`,
    description: 'Measure from the front center of your waistband, down through your crotch, and up to the back center of your waistband to find the rise / kirtha.'
  },
  inseam: {
    title: 'Inseam Length',
    image: `${R2}/images/measurements/measure_inseam.png.jpeg`,
    description: 'Measure the inside of the leg from the crotch down to the ankle bone or desired trouser length.'
  },
  bicep: {
    title: 'Bicep Circumference',
    image: `${R2}/images/measurements/measure_bicep.png.jpeg`,
    description: 'Wrap the tape horizontally around the widest part of your upper arm bicep while holding your arm relaxed.'
  }
};

// ─── UPLOAD TYPES ─────────────────────────────────────────────────────────────
interface UploadedImage {
  label: string;
  refKey: string;
  file: File | null;
  preview: string | null;
  url: string | null;
  uploading: boolean;
  error: string | null;
}

const WHATSAPP_NUMBER = '919030727629';

// ─── INNER PAGE COMPONENT ─────────────────────────────────────────────────────
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
      'indo-western': 'indo-western',
    };
    return map[cat.toLowerCase()] || cat;
  };

  const defaultGarment = rawCategory ? categoryToGarmentId(rawCategory) : '';
  const initialStep = defaultGarment ? 2 : 1;

  const [step, setStep]       = useState(initialStep);
  const [garment, setGarment] = useState(defaultGarment);
  const [fabric, setFabric]   = useState('');
  const [color, setColor]     = useState('');

  const [availableSwatches, setAvailableSwatches] = useState<DbFabricSwatch[]>([]);
  const [selectedSwatch, setSelectedSwatch] = useState<DbFabricSwatch | null>(null);

  const getCategoryName = (g: string): string => {
    const map: Record<string, string> = {
      suit: 'Suits',
      shirt: 'Shirts',
      pant: 'Pants',
      'modi-coat': 'Modi Coat',
      jodhpuri: 'Jodhpuri',
      sherwani: 'Sherwani',
      blazer: 'Blazers',
      kurta: 'Kurta',
      'indo-western': 'Indo Western'
    };
    return map[g] || 'Suits';
  };

  useEffect(() => {
    if (garment) {
      const cat = getCategoryName(garment);
      getFabricSwatchesByCategory(cat).then(res => {
        setAvailableSwatches(res || []);
        setSelectedSwatch(null);
        setFabric('');
        setColor('');
      });
    }
  }, [garment]);

  const [measurements, setMeasurements] = useState<Measurements>({
    height: '', weight: '',
    chest: '', stomach: '', shoulder: '', shoulderLength: '', sleeveLength: '', neck: '', bicep: '',
    shirtLength: '', coatLength: '', waistcoatLength: '', kurtiLength: '',
    waist: '', hips: '', thigh: '', knee: '', ankle: '', rise: '', inseam: '',
    pantLength: '', seatWidth: '',
  });

  const [styleOptions, setStyleOptions] = useState<StyleOptions>({
    pantFinish: '', cutStyle: '', buttonCount: '', lapelStyle: '', lapelColor: '',
    pocketStyle: '', buttonPlacement: '', splitStyle: '', pyjamaModel: '', pyjamaElastic: '',
    pantClosure: '', buttonColor: '',
  });

  // ── Add-on toggles & extra fields ──────────────────────────────────────────
  const [suitPieceType,  setSuitPieceType]  = useState('');        // '2-piece' | '3-piece'
  const [suitAddShirt,   setSuitAddShirt]   = useState(false);
  const [modiAddKurti,   setModiAddKurti]   = useState(false);
  const [modiAddPyjama,  setModiAddPyjama]  = useState(false);
  const [kurtiAddPyjama, setKurtiAddPyjama] = useState(false);
  const [requiredDate,   setRequiredDate]   = useState('');

  const [images, setImages] = useState<UploadedImage[]>([
    { label: 'Front View', refKey: 'front', file: null, preview: null, url: null, uploading: false, error: null },
    { label: 'Back View',  refKey: 'back',  file: null, preview: null, url: null, uploading: false, error: null },
    { label: 'Side View',  refKey: 'side',  file: null, preview: null, url: null, uploading: false, error: null },
  ]);
  const [notes, setNotes]               = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [uploading, setUploading]       = useState(false);
  const [toast, setToast]               = useState<{ message: string; fields: string[] } | null>(null);
  const [activeField, setActiveField]   = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [lightboxImg, setLightboxImg]   = useState<string | null>(null);

  const fileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // ── Dismiss toast on timeout ────────────────────────────────────────────────
  const showToast = useCallback((message: string, fields: string[]) => {
    setToast({ message, fields });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Measurement + style option handlers ────────────────────────────────────
  const handleMeasurement = (key: keyof Measurements, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const handleStyleOption = (key: keyof StyleOptions, value: string) => {
    setStyleOptions(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value, // toggle off if same chip clicked
    }));
  };

  // ── Required field helpers ──────────────────────────────────────────────────
  const getRequiredFields = (): MeasurementField[] => {
    if (!garment) return [];
    const sections = GARMENT_MEASUREMENTS[garment] || [];
    return sections.flatMap(s => s.fields.filter(f => f.required));
  };

  const getMissingRequiredFields = (): MeasurementField[] => {
    return getRequiredFields().filter(f => !measurements[f.key]);
  };

  // ── Image handlers ──────────────────────────────────────────────────────────
  const handleImageSelect = async (index: number, file: File) => {
    const preview = URL.createObjectURL(file);
    
    // Set preview and uploading status in state
    setImages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], file, preview, url: null, error: null, uploading: true };
      return updated;
    });

    try {
      const url = await uploadToR2(file, images[index].label);
      setImages(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], url, uploading: false };
        return updated;
      });
    } catch (err) {
      console.error(`Error uploading photo ${images[index].label}:`, err);
      setImages(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], uploading: false, error: 'Upload failed – please retry' };
        return updated;
      });
    }
  };

  const uploadToR2 = async (file: File, label: string): Promise<string> => {
    // Compress image client-side to WebP (< 200KB) before uploading to save storage & bandwidth
    const { compressImage } = await import('@/lib/compressImage');
    const optimizedFile = await compressImage(file);

    const fileExt = optimizedFile.name.slice(optimizedFile.name.lastIndexOf('.')) || '.webp';
    const filename = `measure_${Date.now()}_${label.toLowerCase().replace(/\s+/g, '_')}${fileExt}`;
    
    // Step 1: Request presigned PUT URL from our internal API
    const res = await fetch('/api/r2-presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: 'customer_measurements',
        publicId: filename,
        contentType: optimizedFile.type || 'image/webp'
      })
    });

    if (!res.ok) throw new Error('Failed to get R2 upload signature');
    const { uploadUrl, publicUrl } = await res.json();

    // Step 2: PUT file directly to Cloudflare R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': optimizedFile.type || 'image/webp' },
      body: optimizedFile
    });

    if (!uploadRes.ok) throw new Error('R2 direct upload failed');
    return publicUrl;
  };

  const handleUploadImages = async (): Promise<UploadedImage[]> => {
    setUploading(true);
    const updated = [...images];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].file && !updated[i].url) {
        updated[i] = { ...updated[i], uploading: true };
        setImages([...updated]);
        try {
          const url = await uploadToR2(updated[i].file!, updated[i].label);
          updated[i] = { ...updated[i], url, uploading: false };
        } catch (err) {
          console.error(`R2 direct upload error for ${updated[i].label}:`, err);
          updated[i] = { ...updated[i], uploading: false, error: 'Upload skipped – share on WhatsApp', url: 'PENDING_WHATSAPP' };
        }
        setImages([...updated]);
      }
    }
    setUploading(false);
    return updated;
  };

  // ── Build WhatsApp message ──────────────────────────────────────────────────
  const buildWhatsAppMessage = (imagesList: UploadedImage[] = images): string => {
    const selectedGarment = GARMENT_TYPES.find(g => g.id === garment);
    const missingFields   = getMissingRequiredFields();

    let msg = `✂️ *CUSTOM ORDER ENQUIRY*\n`;
    msg += `*Madhu Textorium, Visakhapatnam*\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (customerName)  msg += `👤 *Customer:* ${customerName}\n`;
    if (customerPhone) msg += `📞 *Phone:* ${customerPhone}\n`;
    if (customerName || customerPhone) msg += `\n`;
    msg += `👔 *Garment:* ${selectedGarment?.label || garment}`;
    if (garment === 'suit' && suitPieceType) msg += ` (${suitPieceType})`;
    msg += `\n`;
    if (fabric) msg += `🧵 *Fabric:* ${fabric}\n`;
    if (color)  msg += `🎨 *Color:* ${color}\n`;
    if (requiredDate) msg += `📅 *Required By:* ${requiredDate}\n`;
    msg += `\n`;

    // Style Options
    const activeStyleOptions = GARMENT_STYLE_OPTIONS[garment] || [];
    const filledStyleOptions = activeStyleOptions.filter(g => styleOptions[g.key]);
    if (filledStyleOptions.length > 0) {
      msg += `✂️ *STYLE PREFERENCES:*\n━━━━━━━━━━━━━━━━━━━━\n`;
      filledStyleOptions.forEach(g => {
        msg += `• ${g.label}: ${styleOptions[g.key]}\n`;
      });
      msg += `\n`;
    }

    // 3-piece waistcoat length
    if (garment === 'suit' && suitPieceType === '3-piece' && measurements.waistcoatLength) {
      msg += `📐 *Waistcoat Length:* ${measurements.waistcoatLength}"\n\n`;
    }

    // Measurements
    const sections = GARMENT_MEASUREMENTS[garment] || [];
    msg += `📏 *MEASUREMENTS:*\n━━━━━━━━━━━━━━━━━━━━\n`;
    sections.forEach(section => {
      const filled = section.fields.filter(f => measurements[f.key]);
      if (filled.length > 0) {
        msg += `\n*${section.title}:*\n`;
        filled.forEach(f => {
          const val  = measurements[f.key];
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
    imagesList.forEach(img => {
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
    if (submitting) return;
    setSubmitting(true);
    try {
      // 1. Upload images to Cloudflare R2 and get their latest URLs
      const latestImages = await handleUploadImages();

      // 2. Filter active measurements and styles
      const activeMeasurements: Record<string, string> = {};
      Object.entries(measurements).forEach(([key, val]) => {
        if (val) activeMeasurements[key] = val;
      });

      const activeStylePrefs: Record<string, string> = {};
      Object.entries(styleOptions).forEach(([key, val]) => {
        if (val) activeStylePrefs[key] = val;
      });

      // 3. Write order to Supabase
      await createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        garment_type: garment,
        fabric_preference: fabric,
        color_preference: color || '',
        style_preferences: activeStylePrefs,
        measurements: activeMeasurements,
        photo_front_url: latestImages[0]?.url || undefined,
        photo_back_url: latestImages[1]?.url || undefined,
        photo_side_url: latestImages[2]?.url || undefined,
        special_instructions: notes,
      });

      // 4. Open pre-filled WhatsApp confirmation
      const msg = buildWhatsAppMessage(latestImages);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    } catch (err) {
      console.error('Failed to save order to database:', err);
      // Fallback: Proceed to WhatsApp anyway so the customer's submit flow is not blocked
      const msg = buildWhatsAppMessage();
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Validation & navigation ─────────────────────────────────────────────────
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

  const canProceedStep1   = garment !== '';
  const isStep3Complete   = images.some(img => img.file !== null);
  const activeSections    = garment ? (GARMENT_MEASUREMENTS[garment] || []) : [];
  const activeStyleGroups = garment ? (GARMENT_STYLE_OPTIONS[garment] || []) : [];

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

      {/* Step Progress */}
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

            {/* ── Suit piece type selector ── */}
            {garment === 'suit' && (
              <div className={styles.styleOptionsSection} style={{ marginBottom: 24 }}>
                <h3 className={styles.styleOptionsSectionTitle}>
                  <FiScissors size={16} style={{ color: 'var(--accent)' }} />
                  Suit Type
                </h3>
                <p className={styles.styleOptionsHint}>Choose whether you want a 2-piece or 3-piece suit.</p>
                <div className={styles.styleChipRow}>
                  {['2-piece', '3-piece'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      className={`${styles.styleChip} ${suitPieceType === opt ? styles.styleChipActive : ''}`}
                      onClick={() => setSuitPieceType(prev => prev === opt ? '' : opt)}
                    >
                      {suitPieceType === opt && <FiCheck size={11} />}
                      {opt}
                    </button>
                  ))}
                </div>
                {suitPieceType === '3-piece' && (
                  <div className="form-group" style={{ marginTop: 16, maxWidth: 280 }}>
                    <label className="form-label">
                      Waistcoat Length <span className={styles.unitBadge}>in</span>
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="e.g. 26"
                      value={measurements.waistcoatLength}
                      onChange={e => handleMeasurement('waistcoatLength', e.target.value)}
                    />
                    <p className={styles.fieldHint}>Nape to desired waistcoat hem</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Measurement fields & integrated guides ── */}
            <div className={styles.measureGrid}>
              {activeSections.map((section) => {
                // Find which guide should be displayed in this section.
                // If a field in this section is focused, show it. Otherwise, default to the first field of the section.
                const sectionGuide = (() => {
                  const hasActiveField = section.fields.some(f => f.key === activeField);
                  if (hasActiveField && activeField) {
                    return MEASUREMENT_GUIDES[activeField];
                  }
                  if (section.fields.length > 0) {
                    return MEASUREMENT_GUIDES[section.fields[0].key];
                  }
                  return null;
                })();

                return (
                  <div key={section.title} className={styles.measureSection}>
                    <h3 className={styles.measureSectionTitle}>{section.title}</h3>

                    {/* Integrated Section Guide Header */}
                    {sectionGuide && (
                      <div className={styles.sectionGuideHeader}>
                        <div className={styles.sectionGuideImageWrap}>
                          <Image
                            src={sectionGuide.image}
                            alt={sectionGuide.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 240px"
                            style={{ objectFit: 'contain' }}
                            priority
                          />
                        </div>
                        <div className={styles.sectionGuideContent}>
                          <span className={styles.sectionGuideLabel}>{sectionGuide.title} Guide</span>
                          <p className={styles.sectionGuideText}>{sectionGuide.description}</p>
                        </div>
                      </div>
                    )}

                    <div className={styles.measureFields}>
                      {section.fields.map(field => {
                        const isFocused = activeField === field.key;
                        return (
                          <div key={field.key} className="form-group">
                            <label className="form-label">
                              {field.label}
                              {field.required && <span className={styles.reqStar}> *</span>}
                              <span className={styles.unitBadge}>{field.unit}</span>
                            </label>
                            <input
                              className={`form-input ${isFocused ? styles.formInputFocused : ''}`}
                              type="number"
                              placeholder={`e.g. ${field.placeholder}`}
                              value={measurements[field.key]}
                              onChange={e => handleMeasurement(field.key, e.target.value)}
                              onFocus={() => setActiveField(field.key)}
                            />
                            {field.hint && <p className={styles.fieldHint}>{field.hint}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Style Options (chip selectors) ── */}
            {activeStyleGroups.length > 0 && (
              <div className={styles.styleOptionsSection}>
                <h3 className={styles.styleOptionsSectionTitle}>
                  <FiScissors size={16} style={{ color: 'var(--accent)' }} />
                  Style Preferences
                </h3>
                <p className={styles.styleOptionsHint}>
                  Select your preferred style options. These will be shared with the tailor.
                </p>
                <div className={styles.styleOptionsGrid}>
                  {activeStyleGroups.map(group => (
                    <div key={group.key} className={styles.styleOptionGroup}>
                      <label className={styles.styleOptionLabel}>{group.label}</label>
                      {group.hint && <p className={styles.fieldHint}>{group.hint}</p>}

                      {group.isText ? (
                        /* Free-text input for button colour etc. */
                        <input
                          className="form-input"
                          type="text"
                          placeholder={group.hint || 'e.g. Gold, Black, Silver...'}
                          value={styleOptions[group.key]}
                          onChange={e => setStyleOptions(prev => ({ ...prev, [group.key]: e.target.value }))}
                        />
                      ) : (
                        /* Chip selector */
                        <div className={styles.styleChipRow}>
                          {group.options.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              className={`${styles.styleChip} ${styleOptions[group.key] === opt ? styles.styleChipActive : ''}`}
                              onClick={() => handleStyleOption(group.key, opt)}
                            >
                              {styleOptions[group.key] === opt && <FiCheck size={11} />}
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Add-Ons ── */}
            {(garment === 'suit' || garment === 'modi-coat' || garment === 'kurta') && (
              <div className={styles.styleOptionsSection}>
                <h3 className={styles.styleOptionsSectionTitle}>
                  <FiScissors size={16} style={{ color: 'var(--accent)' }} />
                  Add-Ons (Optional)
                </h3>
                <p className={styles.styleOptionsHint}>
                  Would you like to add any additional garments? These are optional.
                </p>

                {/* Suit — add shirt */}
                {garment === 'suit' && (
                  <div className={styles.addOnCard}>
                    <div className={styles.addOnHeader} onClick={() => setSuitAddShirt(v => !v)}>
                      <div className={styles.addOnToggle}>
                        <div className={`${styles.addOnCheckbox} ${suitAddShirt ? styles.addOnChecked : ''}`}>
                          {suitAddShirt && <FiCheck size={12} />}
                        </div>
                        <div>
                          <p className={styles.addOnTitle}>Add a Shirt</p>
                          <p className={styles.addOnDesc}>A custom shirt stitched to complement your suit — no extra measurements needed.</p>
                        </div>
                      </div>
                    </div>
                    {suitAddShirt && (
                      <div className={styles.addOnBody}>
                        <div className={styles.addOnNote}>
                          <FiInfo size={14} />
                          <span>Your shirt will be tailored using the suit measurements already provided. No additional input is required.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Modi Coat — add Kurti and/or Pyjama */}
                {garment === 'modi-coat' && (
                  <>
                    <div className={styles.addOnCard}>
                      <div className={styles.addOnHeader} onClick={() => setModiAddKurti(v => !v)}>
                        <div className={styles.addOnToggle}>
                          <div className={`${styles.addOnCheckbox} ${modiAddKurti ? styles.addOnChecked : ''}`}>
                            {modiAddKurti && <FiCheck size={12} />}
                          </div>
                          <div>
                            <p className={styles.addOnTitle}>Add a Kurti</p>
                            <p className={styles.addOnDesc}>A matching kurti to wear under your Modi coat.</p>
                          </div>
                        </div>
                      </div>
                      {modiAddKurti && (
                        <div className={styles.addOnBody}>
                          <div className="form-group" style={{ maxWidth: 280 }}>
                            <label className="form-label">Kurti Length <span className={styles.unitBadge}>in</span></label>
                            <input
                              className="form-input"
                              type="number"
                              placeholder="e.g. 38"
                              value={measurements.kurtiLength}
                              onChange={e => handleMeasurement('kurtiLength', e.target.value)}
                            />
                            <p className={styles.fieldHint}>Nape to desired kurti hem (remaining measurements are shared with Modi coat)</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.addOnCard}>
                      <div className={styles.addOnHeader} onClick={() => setModiAddPyjama(v => !v)}>
                        <div className={styles.addOnToggle}>
                          <div className={`${styles.addOnCheckbox} ${modiAddPyjama ? styles.addOnChecked : ''}`}>
                            {modiAddPyjama && <FiCheck size={12} />}
                          </div>
                          <div>
                            <p className={styles.addOnTitle}>Add a Pyjama</p>
                            <p className={styles.addOnDesc}>A matching pyjama bottom to complete the ensemble.</p>
                          </div>
                        </div>
                      </div>
                      {modiAddPyjama && (
                        <div className={styles.addOnBody}>
                          <p className={styles.styleOptionsHint} style={{ marginBottom: 12 }}>Enter pyjama measurements (all optional):</p>
                          <div className={styles.measureFields}>
                            {[
                              { key: 'pantLength' as keyof Measurements, label: 'Pyjama Length', placeholder: '42', hint: 'Waist to ankle' },
                              { key: 'waist' as keyof Measurements, label: 'Waist', placeholder: '34', hint: 'Natural waistline' },
                              { key: 'thigh' as keyof Measurements, label: 'Thigh', placeholder: '22', hint: 'Upper thigh circumference' },
                              { key: 'knee' as keyof Measurements, label: 'Knee', placeholder: '16', hint: 'Circumference around knee' },
                              { key: 'ankle' as keyof Measurements, label: 'Ankle', placeholder: '13', hint: 'Circumference around ankle' },
                              { key: 'rise' as keyof Measurements, label: 'Rise / Kirtha', placeholder: '11', hint: 'Waist to crotch and half value should be taken' },
                            ].map(f => (
                              <div key={f.key} className="form-group">
                                <label className="form-label">{f.label} <span className={styles.unitBadge}>in</span></label>
                                <input className="form-input" type="number" placeholder={`e.g. ${f.placeholder}`}
                                  value={measurements[f.key]} onChange={e => handleMeasurement(f.key, e.target.value)} />
                                <p className={styles.fieldHint}>{f.hint}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Kurta — add Pyjama */}
                {garment === 'kurta' && (
                  <div className={styles.addOnCard}>
                    <div className={styles.addOnHeader} onClick={() => setKurtiAddPyjama(v => !v)}>
                      <div className={styles.addOnToggle}>
                        <div className={`${styles.addOnCheckbox} ${kurtiAddPyjama ? styles.addOnChecked : ''}`}>
                          {kurtiAddPyjama && <FiCheck size={12} />}
                        </div>
                        <div>
                          <p className={styles.addOnTitle}>Add a Pyjama</p>
                          <p className={styles.addOnDesc}>A matching pyjama to go with your kurta. You can fill in the measurements from the section above or here.</p>
                        </div>
                      </div>
                    </div>
                    {kurtiAddPyjama && (
                      <div className={styles.addOnBody}>
                        <div className={styles.addOnNote}>
                          <FiInfo size={14} />
                          <span>You can fill pyjama measurements in the &quot;Pyjama / Salwar Measurements&quot; section above — they will be included in your order.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Special Instructions (moved from Step 4) ── */}
            <div className={styles.styleOptionsSection}>
              <h3 className={styles.styleOptionsSectionTitle}>
                <FiInfo size={16} style={{ color: 'var(--accent)' }} />
                Special Instructions
              </h3>
              <div className="form-group">
                <label className="form-label">Design Notes / Additional Instructions</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe any specific design elements, lining preferences, pocket styles, button types, embroidery, monogram, or any other customization..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ minHeight: 120 }}
                />
              </div>
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

                  {/* Reference Image Guide */}
                  <div
                    className={styles.photoReference}
                    onClick={() => setLightboxImg(`${R2}/images/references/${img.refKey}.png`)}
                  >
                    <div className={styles.photoReferenceImageWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${R2}/images/references/${img.refKey}.png`}
                        alt={`${img.label} Reference`}
                        className={styles.photoReferenceImg}
                      />
                      <div className={styles.photoReferenceOverlay}>
                        <span>Tap to zoom</span>
                      </div>
                    </div>
                    <div className={styles.photoReferenceLabel}>
                      Reference Pose
                    </div>
                  </div>
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
              <h2 className={styles.stepTitle}>Fabric, Style &amp; Details</h2>
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
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Select Fabric Swatch *</label>
                {availableSwatches.length === 0 ? (
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No fabric swatches available for this category. You can write your custom preference in the design notes below.
                  </div>
                ) : (
                  <div className={styles.swatchSelectGrid}>
                    {availableSwatches.map(sw => (
                      <div
                        key={sw.id}
                        className={`${styles.swatchSelectCard} ${selectedSwatch?.id === sw.id ? styles.swatchSelectActive : ''}`}
                        onClick={() => {
                          setSelectedSwatch(sw);
                          setFabric(sw.image);
                          setColor(''); // Clear color preference as swatches map color & fabric together
                        }}
                      >
                        <div className={styles.swatchSelectImage}>
                          <img src={sw.image} alt="Fabric Swatch" />
                          {selectedSwatch?.id === sw.id && (
                            <div className={styles.swatchSelectCheck}>✓</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Required By Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={requiredDate}
                  min={(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 3);
                    return d.toISOString().split('T')[0];
                  })()}
                  onChange={e => setRequiredDate(e.target.value)}
                  style={{ maxWidth: 280 }}
                />
                <p className={styles.fieldHint}>
                  📅 Please allow a minimum of 3 days from today for tailoring. Dates within the next 3 days are not available.
                </p>
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
              <h2 className={styles.stepTitle}>Review &amp; Send</h2>
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
                  {fabric && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: color ? 8 : 0 }}>
                      {fabric.startsWith('http') ? (
                        <img src={fabric} alt="Selected Fabric"
                          style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-subtle)', cursor: 'zoom-in' }}
                          onClick={() => setLightboxImg(fabric)}
                        />
                      ) : (
                        <span className={styles.reviewValue} style={{ margin: 0 }}>Fabric: <strong>{fabric}</strong></span>
                      )}
                    </div>
                  )}
                  {color  && <p className={styles.reviewValue}>Color: {color}</p>}
                </div>
              )}

              {/* Style options review */}
              {(GARMENT_STYLE_OPTIONS[garment] || []).some(g => styleOptions[g.key]) && (
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewSectionTitle}>Style Preferences</h3>
                  {(GARMENT_STYLE_OPTIONS[garment] || [])
                    .filter(g => styleOptions[g.key])
                    .map(g => (
                      <p key={g.key} className={styles.reviewValue}>
                        {g.label}: <strong>{styleOptions[g.key]}</strong>
                      </p>
                    ))}
                </div>
              )}

              <div className={styles.reviewSection}>
                <h3 className={styles.reviewSectionTitle}>Measurements</h3>
                <div className={styles.reviewMeasures}>
                  {activeSections.map(section => {
                    const filled = section.fields.filter(f => measurements[f.key]);
                    if (filled.length === 0) return null;
                    return (
                      <div key={section.title}>
                        <p className={styles.reviewMeasureSectionLabel}>{section.title}</p>
                        {filled.map(f => (
                          <div key={f.key} className={styles.reviewMeasureItem}>
                            <span>{f.label}</span>
                            <span className={styles.reviewMeasureVal}>
                              {measurements[f.key]}{f.unit === 'cm' ? ' cm' : f.unit === 'kg' ? ' kg' : '"'}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
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
                        <img
                          src={img.preview}
                          alt={img.label}
                          className={styles.reviewPhotoImg}
                          style={{ cursor: 'zoom-in' }}
                          onClick={() => setLightboxImg(img.preview)}
                        />
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
                disabled={submitting || uploading || !garment}
                style={{ padding: '16px 40px', fontSize: '1rem' }}
              >
                {submitting || uploading ? (
                  <><div className={styles.spinner} /> Processing...</>
                ) : (
                  <><FaWhatsapp size={20} /> Send to WhatsApp</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {lightboxImg && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', backdropFilter: 'blur(4px)'
          }}
          onClick={() => setLightboxImg(null)}
        >
          <button
            style={{
              position: 'absolute', top: 20, right: 20, background: 'none', border: 'none',
              color: '#fff', fontSize: '2.5rem', cursor: 'pointer', outline: 'none'
            }}
            onClick={(e) => { e.stopPropagation(); setLightboxImg(null); }}
          >
            ✕
          </button>
          <img
            src={lightboxImg}
            alt="Enlarged view"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', cursor: 'default' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}

// ─── PAGE WRAPPER (required for useSearchParams) ──────────────────────────────
export default function CustomizePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <FiScissors size={32} style={{ color: 'var(--accent)', marginBottom: 16 }} />
          <p>Loading customization form...</p>
        </div>
      </div>
    }>
      <CustomizePageInner />
    </Suspense>
  );
}
