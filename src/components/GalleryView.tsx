"use client";
import React, { useState, useContext } from 'react';
import { Image as ImageIcon, RefreshCw, Edit3, Database, Download, X, MessageSquare } from 'lucide-react';
import { StyleContext } from '@/context/StyleContext';
import { ApiService } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';

export const GalleryView = () => {
    const { state, dispatch } = useContext(StyleContext);
    const [sendingCardId, setSendingCardId] = useState<string | null>(null);

    const handleEdit = (item: any) => {
        dispatch({
            type: 'SET_MODAL',
            payload: { isOpen: true, baseImage: item.image, context: { sub1: item.sub1, sub2: item.sub2 } }
        });
    };

    const handleRemove = (id: string) => {
        dispatch({ type: 'REMOVE_GALLERY_ITEM', payload: id });
    };

    const handleReference = (item: any) => {
        dispatch({ type: 'SET_ASSET', key: 'reference', payload: item.image });
        dispatch({ type: 'SET_VIEW', payload: 'setup' });
        dispatch({ type: 'SET_STYLE_JSON', payload: {} });
    };

    const handleRefine = (item: any) => {
        dispatch({
            type: 'LOAD_CHAT_CONTEXT',
            payload: {
                json: JSON.parse(item.json),
                signature: item.thoughtSignature || null
            }
        });
    };

    const handleSendCardToPinecone = async (item: any) => {
        if (!item.json) return;
        setSendingCardId(item.id);
        try {
            const jsonData = JSON.parse(item.json);
            const id = `style-${Date.now()}`;
            const summary = `${jsonData.general?.artDirection || ''} ${jsonData.general?.mood || ''} ${jsonData.outfit?.outfitDetails || ''}`;
            const textContent = summary.trim() !== '' ? summary : "Gallery Generated Style";

            await ApiService.addStyleLibrary(id, textContent, jsonData);
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Saved Gallery style to Library successfully!`, type: 'success' } });
        } catch (e: any) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Save Failed: ${e.message}`, type: 'error' } });
        } finally {
            setSendingCardId(null);
        }
    };


    if (state.gallery.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <ImageIcon size={64} strokeWidth={1} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-600">Gallery Empty</p>
                <p className="text-sm">Generate images to see them here.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 pb-24 grid grid-cols-1 gap-6 max-w-2xl mx-auto">
            {state.gallery.map((item: any) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden group">
                    {item.status === 'loading' ? (
                        <div className="aspect-square bg-gray-50 flex flex-col items-center justify-center">
                            <Spinner className="w-10 h-10 text-violet-500 mb-3" />
                            <p className="text-sm font-medium text-gray-500 animate-pulse">Designing Masterpiece...</p>
                        </div>
                    ) : item.status === 'failed' ? (
                        <div className="aspect-square bg-red-50 flex flex-col items-center justify-center p-6 text-center">
                            <X className="w-10 h-10 text-red-500 mb-3" />
                            <p className="text-sm font-bold text-red-700 mb-1">Generation Failed</p>
                            <p className="text-xs text-red-600 line-clamp-3 mb-4">{item.error || 'Unknown error occurred'}</p>
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                            >
                                Remove Card
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative aspect-auto bg-gray-100">
                                <img src={`data:image/png;base64,${item.image}`} alt="Generated" className="w-full h-full object-contain" />
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleReference(item)} className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80" title="Use as Reference"><RefreshCw size={16} /></button>
                                    <button onClick={() => handleEdit(item)} className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80" title="Edit"><Edit3 size={16} /></button>
                                    <button
                                        onClick={() => handleSendCardToPinecone(item)}
                                        disabled={sendingCardId === item.id}
                                        className={`p-2 bg-black/60 text-white rounded-full hover:bg-black/80 ${sendingCardId === item.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        title={`Save to Library`}
                                    >
                                        {sendingCardId === item.id ? <Spinner className="w-4 h-4 text-white" /> : <Database size={16} />}
                                    </button>
                                    <a href={`data:image/png;base64,${item.image}`} download={`gen-${item.id}.png`} className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80"><Download size={16} /></a>
                                    <button onClick={() => handleRemove(item.id)} className="p-2 bg-red-600/80 text-white rounded-full hover:bg-red-700" title="Remove"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Generated by {(() => {
                                        const model = item.model || state.selectedModel;
                                        if (model.includes('2')) return 'Nano Banana 2';
                                        return 'Nano Banana';
                                    })()}
                                </span>
                                <button onClick={() => handleRefine(item)} className="text-xs font-semibold text-violet-700 hover:underline flex items-center gap-1">
                                    Refine in Chat <MessageSquare size={12} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};
