import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
    label: string;
    image: string | null;
    onUpload: (data: string) => void;
    onClear: () => void;
    onAction?: () => void;
    actionIcon?: React.ElementType;
    actionTitle?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    label, image, onUpload, onClear, onAction, actionIcon: ActionIcon, actionTitle
}) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
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

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
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
        <div
            className={`relative h-48 border rounded-xl overflow-hidden transition-all group ${isDragging ? 'border-violet-500 bg-violet-100/50 scale-[1.02]' : 'bg-gray-50 border-gray-200 hover:border-violet-400 hover:bg-violet-50/30'
                }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {image ? (
                <>
                    <img src={`data:image/png;base64,${image}`} alt="Preview" className="w-full h-full object-contain p-2" />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onAction && ActionIcon && (
                            <button onClick={onAction} title={actionTitle} className="p-1.5 bg-white/90 text-violet-700 rounded-full shadow-sm hover:bg-violet-100">
                                <ActionIcon size={16} />
                            </button>
                        )}
                        <button onClick={onClear} className="p-1.5 bg-gray-900/80 text-white rounded-full shadow-sm hover:bg-black">
                            <X size={16} />
                        </button>
                    </div>
                </>
            ) : (
                <div onClick={() => fileInput.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-violet-600 transition-colors">
                    <Upload size={32} strokeWidth={1.5} className="mb-2" />
                    <span className="text-sm font-medium">{label}</span>
                    <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>
            )}
        </div>
    );
};
