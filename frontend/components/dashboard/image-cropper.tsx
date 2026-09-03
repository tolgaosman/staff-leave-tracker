"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImg, Area } from "@/lib/image";

export function ImageCropper({
  open,
  imageSrc,
  onClose,
  onComplete,
}: {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onComplete: (croppedBase64: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 200);
      onComplete(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity" />
        <Dialog.Popup className="glass-panel fixed left-1/2 top-1/2 z-[60] flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl overflow-hidden shadow-2xl transition-all">
          <div className="p-4 border-b border-outline-variant/20">
            <Dialog.Title className="text-xl font-bold text-on-surface">Resmi Kırp</Dialog.Title>
            <Dialog.Description className="text-sm text-on-surface-variant">
              Görseli sürükleyerek veya yakınlaştırarak ayarlayın.
            </Dialog.Description>
          </div>
          
          <div className="relative h-[280px] w-full bg-black sm:h-[400px]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape="round"
              showGrid={false}
            />
          </div>

          <div className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 border-t border-outline-variant/20">
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs font-mono text-on-surface-variant">Zoom:</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-accent-cyan"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button className="bg-accent-cyan text-white hover:bg-accent-cyan/90" onClick={handleApply} disabled={isProcessing}>
                {isProcessing ? "İşleniyor..." : "Uygula"}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
