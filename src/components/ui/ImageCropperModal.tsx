import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import getCroppedImg, { Area } from '@/utils/cropImage'
import { X, Check, Loader2 } from 'lucide-react'

interface ImageCropperModalProps {
  imageFile: File;
  aspectRatio: number;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => Promise<void>;
}

export default function ImageCropperModal({ 
  imageFile, 
  aspectRatio, 
  onClose, 
  onCropComplete 
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const [imageSrc, setImageSrc] = useState<string>('')

  // Create and clean up local object URL for the image safely (Strict Mode friendly)
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Observe container size using ResizeObserver and fallback timers
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    const measure = () => {
      const w = container.clientWidth || container.offsetWidth;
      const h = container.clientHeight || container.offsetHeight;
      if (w > 0 && h > 0) {
        setDimensions({ width: w, height: h });
      }
    };

    // Measure immediately
    measure();

    // Measure in animation frame and timeout
    const rafId = requestAnimationFrame(measure);
    const timerId = setTimeout(measure, 100);

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width || container.offsetWidth;
        const h = entry.contentRect.height || container.offsetHeight;
        if (w > 0 && h > 0) {
          setDimensions({ width: w, height: h });
        }
      }
    });
    
    resizeObserver.observe(container);
    window.addEventListener('resize', measure);
    
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Safe active container sizes
  const activeWidth = dimensions.width || 600;
  const activeHeight = dimensions.height || 400;

  // Compute crop box dimensions based on container sizes and requested aspect ratio
  const cropDims = useMemo(() => {
    const pad = 40; // padding around crop box
    const maxW = activeWidth - pad * 2;
    const maxH = activeHeight - pad * 2;
    
    let cropWidth = maxW;
    let cropHeight = maxW / aspectRatio;
    
    if (cropHeight > maxH) {
      cropHeight = maxH;
      cropWidth = maxH * aspectRatio;
    }
    
    return { width: cropWidth, height: cropHeight };
  }, [activeWidth, activeHeight, aspectRatio]);

  // Base scale is the minimum scale required for the image to completely cover the crop box
  const baseScale = useMemo(() => {
    if (!imgSize) return 1;
    const scaleX = cropDims.width / imgSize.width;
    const scaleY = cropDims.height / imgSize.height;
    return Math.max(scaleX, scaleY);
  }, [imgSize, cropDims]);

  const currentScale = baseScale * zoom;
  const displayWidth = imgSize ? imgSize.width * currentScale : 0;
  const displayHeight = imgSize ? imgSize.height * currentScale : 0;

  // Enforce boundary constraint limits
  const limits = useMemo(() => {
    if (displayWidth === 0) return { x: 0, y: 0 };
    return {
      x: Math.max(0, (displayWidth - cropDims.width) / 2),
      y: Math.max(0, (displayHeight - cropDims.height) / 2),
    };
  }, [cropDims, displayWidth, displayHeight]);

  // Handle auto-clamping when zooming or resizing changes the boundaries
  useEffect(() => {
    setOffset(prev => ({
      x: Math.max(-limits.x, Math.min(limits.x, prev.x)),
      y: Math.max(-limits.y, Math.min(limits.y, prev.y))
    }));
  }, [limits]);

  // Mouse drag events handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    let newX = e.clientX - dragStartRef.current.x;
    let newY = e.clientY - dragStartRef.current.y;

    newX = Math.max(-limits.x, Math.min(limits.x, newX));
    newY = Math.max(-limits.y, Math.min(limits.y, newY));

    setOffset({ x: newX, y: newY });
  }, [isDragging, limits]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch drag events handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX - offset.x,
      y: e.touches[0].clientY - offset.y,
    };
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    let newX = e.touches[0].clientX - dragStartRef.current.x;
    let newY = e.touches[0].clientY - dragStartRef.current.y;

    newX = Math.max(-limits.x, Math.min(limits.x, newX));
    newY = Math.max(-limits.y, Math.min(limits.y, newY));

    setOffset({ x: newX, y: newY });
  }, [isDragging, limits]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Bind/unbind global drag listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);



  const handleSave = async () => {
    if (!imgSize || cropDims.width === 0) return;

    try {
      setIsProcessing(true);

      // Convert current UI coordinates to natural image crop pixels
      const screenCropX = (displayWidth / 2 - offset.x) - cropDims.width / 2;
      const screenCropY = (displayHeight / 2 - offset.y) - cropDims.height / 2;

      const pixelCrop: Area = {
        x: Math.max(0, screenCropX / currentScale),
        y: Math.max(0, screenCropY / currentScale),
        width: cropDims.width / currentScale,
        height: cropDims.height / currentScale,
      };

      const croppedBlob = await getCroppedImg(imageSrc, pixelCrop, 0);
      
      if (croppedBlob) {
        await onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h3 className="text-xl font-bold text-white">Crop Image</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div 
          ref={containerRef}
          className="relative w-full h-[50vh] bg-black overflow-hidden flex items-center justify-center cursor-move select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {imageSrc && (
            <>
              {/* Unconditionally render the image so onLoad fires, but hide/position offscreen if size is not yet loaded */}
              <img
                src={imageSrc}
                alt="To Crop"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
                }}
                onError={(e) => {
                  console.error("Failed to load image in cropper:", e);
                }}
                className="max-w-none pointer-events-none"
                style={imgSize ? {
                  width: displayWidth,
                  height: displayHeight,
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  position: 'absolute',
                } : {
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                  top: -9999,
                  left: -9999,
                }}
              />

              {imgSize && (
                /* Crop Frame Overlay Mask */
                <div 
                  className="absolute border border-white/80 pointer-events-none"
                  style={{
                    width: cropDims.width,
                    height: cropDims.height,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-6 border-t border-border bg-muted/20 space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground/90 block mb-3">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.01}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || !imgSize}
              className="bg-brand-gradient text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 text-white" />
              )}
              {isProcessing ? 'Processing...' : 'Save & Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
