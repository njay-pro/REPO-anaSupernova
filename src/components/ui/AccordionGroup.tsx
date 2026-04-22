"use client";
import React, { useState, useContext } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { StyleContext } from '@/context/StyleContext';
import { ApiService } from '@/lib/api';
// SYSTEM_PROMPTS removed, using promptKey instead
import { Spinner } from '@/components/ui/Spinner';

interface AccordionGroupProps {
    title: string;
    data: Record<string, string>;
    onUpdate: (group: string, key: string, value: string) => void;
}

export const AccordionGroup: React.FC<AccordionGroupProps> = ({ title, data, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loadingKey, setLoadingKey] = useState<string | null>(null);
    const { state, dispatch } = useContext(StyleContext);

    const handleShuffle = async (key: string, group: string) => {
        setLoadingKey(key);
        try {
            const suggestionRes = await ApiService.generateCall('', [], state.selectedModel, {
                promptKey: 'suggestion',
                params: { field: key, json: state.activeStyleJson },
                modalities: ['TEXT']
            });

            const text = suggestionRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (text) {
                onUpdate(group, key, text);
                dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Generated new idea for ${key}!`, type: 'success' } });
            }
        } catch (e: any) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Failed to suggest idea`, type: 'error' } });
        } finally {
            setLoadingKey(null);
        }
    };

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full py-3 px-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-700 capitalize">{title}</span>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key}>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                            </div>
                            <div className="relative">
                                <input type="text" value={value} onChange={(e) => onUpdate(title, key, e.target.value)} className="w-full text-sm p-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                                <button onClick={() => handleShuffle(key, title)} disabled={loadingKey === key} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600">
                                    {loadingKey === key ? <Spinner className="w-4 h-4" /> : <RefreshCw size={14} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
