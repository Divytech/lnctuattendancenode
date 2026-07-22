"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type ImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
  subtitle?: string;
};

export default function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  title,
  subtitle,
}: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full overflow-hidden rounded-3xl border border-white/20 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300 text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-300 transition-all hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs font-mono font-medium text-purple-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Image Frame */}
        <div className="relative mx-auto max-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner flex items-center justify-center p-2">
          <img
            src={imageSrc}
            alt={title}
            className="max-h-[55vh] w-auto object-contain rounded-xl transition-transform duration-300"
          />
        </div>

        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
          Click outside or press Esc to close
        </p>
      </div>
    </div>
  );
}
