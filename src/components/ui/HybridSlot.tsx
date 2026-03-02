import React, { useRef } from 'react';
import { X, Layers, Download, Wand2 } from 'lucide-react';

interface HybridSlotProps {
    type: 'background' | 'outfit';
    image: string | null;
    onUpload: (data: string) => void;
    onClear: () => void;
    onExtract: () => void;
    isLoading: boolean;
    isChecked: boolean;
    onToggle: (val: boolean) => void;
    hasJson: boolean;
    onExtractJson: () => void;
}

const Spinner = ({ className = "w-5 h-5" }) => (
    <div className={`border-2 border-black/10 border-l-violet-600 rounded-full animate-spin ${className}`} />
);

export const HybridSlot: React.FC<HybridSlotProps> = ({
    type, image, onUpload, onClear, onExtract, isLoading, isChecked, onToggle, hasJson, onExtractJson
}) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (r) => {
                if (typeof r.target?.result === 'string') {
                    onUpload(r.target.result.split(',')[1]);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    return (
        <div className="relative h-48 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm group">
            {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50">
                    <Spinner className="w-8 h-8 text-violet-600" />
                    <span className="text-xs font-medium text-gray-500 mt-2">Extracting...</span>
                </div>
            ) : image ? (
                <>
                    <img src={`data:image/png;base64,${image}`} className="w-full h-full object-contain p-2 bg-[url('https://bg-patterns.netlify.app/bg.png')]" alt={type} />
                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onClear} className="p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80" title="Remove">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/95 border-t border-gray-100 flex items-center justify-between translate-y-full group-hover:translate-y-0 transition-transform">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={isChecked} onChange={(e) => onToggle(e.target.checked)} className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500" />
                            <span className="text-xs font-medium">Use</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={onExtractJson} disabled={!hasJson} className={`p-1.5 rounded-md ${hasJson ? 'text-violet-700 bg-violet-50 hover:bg-violet-100' : 'text-gray-300'}`} title="Transfer">
                                <Layers size={14} />
                            </button>
                            <a href={`data:image/png;base64,${image}`} download={`${type}.png`} className="p-1.5 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                                <Download size={14} />
                            </a>
                        </div>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-sm font-medium text-gray-500 mb-2">{type === 'background' ? 'Background' : 'Outfit'}</p>
                    <div className="flex gap-2">
                        <button onClick={onExtract} className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-semibold rounded-lg hover:bg-violet-100 transition-colors flex items-center gap-1">
                            <Wand2 size={12} /> Auto-Extract
                        </button>
                        <button onClick={() => fileInput.current?.click()} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                            Upload
                        </button>
                        <input ref={fileInput} type="file" className="hidden" onChange={handleFile} />
                    </div>
                </div>
            )}
        </div>
    );
};
