import React, { useRef } from 'react';
import { Building2, Upload, RefreshCw } from 'lucide-react';

interface CompanyLogoProps {
  customLogoUrl?: string;
  onUpdateLogo?: (url?: string) => void;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ customLogoUrl, onUpdateLogo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && onUpdateLogo) {
        onUpdateLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="relative group flex items-center justify-center bg-black/40 border border-[#0066B3]/50 rounded-lg overflow-hidden shadow-inner px-2 py-1 select-none flex-shrink-0"
      style={{
        width: '180px',
        height: '68px', // Exact 909:347 aspect ratio (180 x 68.7 px)
      }}
      title="Company Logo (909x347 aspect ratio). Click to upload custom logo."
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload Company Logo"
      />

      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt="Company Logo"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex items-center gap-2.5 w-full h-full px-1">
          <div className="w-10 h-10 rounded-md bg-[#0066B3] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col text-left justify-center overflow-hidden leading-tight font-sans">
            <span className="text-sm font-black tracking-wider text-white uppercase truncate">
              CLARK
            </span>
            <span className="text-[10px] font-extrabold text-[#00A9E0] tracking-widest uppercase truncate">
              CONSTRUCTION
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono font-bold">
              Pull Plan Studio
            </span>
          </div>
        </div>
      )}

      {/* Hover action overlay to upload / reset logo */}
      <div className="absolute inset-0 bg-[#001430]/90 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded bg-[#00A9E0] hover:bg-[#0095c7] text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer transition-transform hover:scale-105"
          title="Upload 909x347 Logo"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="text-[10px]">Upload</span>
        </button>
        {customLogoUrl && (
          <button
            type="button"
            onClick={() => onUpdateLogo?.(undefined)}
            className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] cursor-pointer"
            title="Reset to default logo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
