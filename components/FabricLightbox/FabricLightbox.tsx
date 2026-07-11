import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { FiX, FiEye, FiEyeOff, FiLoader, FiPlus, FiMinus, FiRotateCcw } from 'react-icons/fi';
import { chromaKeyToTransparent } from '@/utils/chromaKey';
import type { FabricSwatch } from '@/components/ProductModal/ProductModal';
import styles from './FabricLightbox.module.css';

interface Props {
  fabric: FabricSwatch;
  sketchImage: string | undefined;
  garmentName: string;
  onClose: () => void;
}

export default function FabricLightbox({ fabric, sketchImage, garmentName, onClose }: Props) {
  const [sketchOn, setSketchOn]               = useState(false);

  /**
   * processedSketch — holds the chroma-keyed transparent PNG data URL.
   * null   = not yet processed
   * ''     = processing failed / no sketchImage
   * string = ready data URL
   */
  const [processedSketch, setProcessedSketch] = useState<string | null>(null);
  const [processing, setProcessing]           = useState(false);

  /* Panning and Zooming State for Background Fabric */
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoom, setZoom]       = useState(1.0);

  /* Mouse / Touch dragging state */
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  /* Stable per-mount cache-buster so the browser always fetches the latest file */
  const cacheBust = useMemo(() => Date.now(), []);

  /* When the user activates the overlay for the first time, run chroma-key */
  useEffect(() => {
    if (!sketchOn || !sketchImage) return;
    if (processedSketch !== null) return;  // already processed

    setProcessing(true);

    const url = `${sketchImage}?v=${cacheBust}`;
    chromaKeyToTransparent(url, {
      keyColor:  { r: 255, g: 0, b: 255 }, // magenta → transparent
      tolerance: 60,
      softEdge:  20,
    })
      .then(dataUrl => {
        setProcessedSketch(dataUrl);
        setProcessing(false);
      })
      .catch(err => {
        console.error('[FabricLightbox] chromaKey failed:', err);
        // Fallback: use the raw image directly (no chroma-key)
        setProcessedSketch(url);
        setProcessing(false);
      });
  }, [sketchOn, sketchImage, processedSketch, cacheBust]);

  /* Close on Escape */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [handleKey]);

  /* Drag handlers for direct canvas panning */
  const handleStart = (clientX: number, clientY: number) => {
    if (!sketchOn) return;
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
    dragOffset.current = { x: offsetX, y: offsetY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setOffsetX(dragOffset.current.x + dx);
    setOffsetY(dragOffset.current.y + dy);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  /* Wheel handler for scrolling to zoom */
  const handleWheel = (e: React.WheelEvent) => {
    if (!sketchOn) return;
    e.preventDefault();
    const zoomFactor = 0.05;
    const newZoom = e.deltaY < 0 ? zoom + zoomFactor : zoom - zoomFactor;
    setZoom(Math.max(0.5, Math.min(5.0, newZoom)));
  };
  return (
    <>
      {/* Dark backdrop — z above the product modal */}
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.lightbox} role="dialog" aria-modal="true"
           aria-label={`${fabric.name} fabric preview`}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          {/* User requested: no text or fabric name should be displayed here */}
          <div className={styles.topLeft}>
            {/* Intentionally left blank */}
          </div>

          <div className={styles.topRight}>
            {sketchImage && (
              <button
                className={`${styles.eyeBtn} ${sketchOn ? styles.eyeBtnActive : ''}`}
                onClick={() => setSketchOn(v => !v)}
                disabled={processing}
                aria-label={sketchOn ? 'Hide garment preview' : 'See garment on this fabric'}
              >
                {processing
                  ? <FiLoader size={18} className={styles.spinner} />
                  : sketchOn
                    ? <FiEyeOff size={18} />
                    : <FiEye size={18} />
                }
                {processing ? 'Processing…' : sketchOn ? 'Hide Preview' : 'Try On Garment'}
              </button>
            )}

            <button className={styles.closeBtn} onClick={onClose} aria-label="Close preview">
              <FiX size={22} />
            </button>
          </div>
        </div>

        {/* ── Main canvas ── */}
        <div className={styles.canvas}>

          {/* 9:16 Aspect Ratio Container */}
          <div 
            className={styles.canvasContainer}
            onMouseDown={e => handleStart(e.clientX, e.clientY)}
            onMouseMove={e => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleEnd}
            onWheel={handleWheel}
            style={{ cursor: sketchOn ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            {/* Layer 1: fabric fills background */}
            <div 
              className={styles.fabricLayer}
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              <Image
                src={fabric.image}
                alt={fabric.name}
                fill
                priority
                unoptimized
                sizes="100vw"
                style={{ objectFit: 'cover' }}
              />
            </div>

            {/* Layer 2: chroma-keyed sketch overlay */}
            {sketchOn && processedSketch && (
              <div className={styles.sketchLayer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={processedSketch}
                  alt={`${garmentName} garment outline`}
                  className={styles.sketchImg}
                />
              </div>
            )}

            {/* Spinner while chroma-key is processing */}
            {sketchOn && processing && (
              <div className={styles.processingOverlay}>
                <FiLoader size={32} className={styles.spinner} />
                <span>Preparing garment preview…</span>
              </div>
            )}

            {/* Hint shown before first Try-On click */}
            {!sketchOn && sketchImage && (
              <div className={styles.hint}>
                <FiEye size={16} />
                Tap &quot;Try On Garment&quot; to see this fabric stitched
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom label ── */}
        <div className={styles.bottomBar}>
          <span className={styles.bottomNote}>
            {sketchOn && processedSketch
              ? 'Use the controls or drag directly on the garment to sync and position the fabric.'
              : 'This is the raw fabric texture. Toggle "Try On" to preview it as a garment.'}
          </span>
        </div>
      </div>
    </>
  );
}
