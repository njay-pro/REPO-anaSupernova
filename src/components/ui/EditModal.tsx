"use client";
import React, { useState, useContext } from 'react';
import { X, Wand2 } from 'lucide-react';
import { StyleContext } from '@/context/StyleContext';
import { FileUploader } from './FileUploader';
import { Spinner } from './Spinner';
import { ApiService } from '@/lib/api';
// SYSTEM_PROMPTS removed, using promptKey instead

export const EditModal = () => {
    const { state, dispatch } = useContext(StyleContext);
    const { isOpen, baseImage, context } = state.editModal || {};
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [refImg, setRefImg] = useState<string | null>(null);
    const [useOriginals, setUseOriginals] = useState(false);

    if (!isOpen) return null;

    const handleSuggest = async () => {
        setLoading(true);
        try {
            const res = await ApiService.generateCall('', [baseImage], state.selectedModel, {
                promptKey: 'edit-suggestion',
                modalities: ['TEXT']
            });
            const json = ApiService.extractJson(res.candidates?.[0]?.content?.parts?.[0]?.text || '');
            if (json && Array.isArray(json)) setSuggestions(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const images = [baseImage];
            if (refImg) images.push(refImg);
            if (useOriginals && context) {
                if (context.sub1) images.push(context.sub1);
                if (context.sub2) images.push(context.sub2);
            }
            const res = await ApiService.generateCall(prompt, images, state.selectedModel);
            const data = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
            if (data) {
                dispatch({
                    type: 'ADD_GALLERY_ITEM',
                    payload: { id: Date.now(), image: data, json: "{}", sub1: context?.sub1, sub2: context?.sub2, type: 'generated', status: 'complete', model: state.selectedModel }
                });
                dispatch({ type: 'SET_MODAL', payload: { isOpen: false, baseImage: null, context: null } });
                dispatch({ type: 'SET_VIEW', payload: 'gallery' });
                dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Edit applied successfully!", type: 'success' } });
            }
        } catch (e) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Edit failed. Please try again.", type: 'error' } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Edit Image</h3>
                    <button onClick={() => dispatch({ type: 'SET_MODAL', payload: { isOpen: false, baseImage: null, context: null } })}><X /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {baseImage && <img src={`data:image/png;base64,${baseImage}`} className="max-h-full max-w-full object-contain" alt="Base preview" />}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Instruction</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Change the background to a neon city..."
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                            rows={2}
                        />
                        <button onClick={handleSuggest} className="text-xs text-violet-600 font-semibold hover:underline">
                            {loading && suggestions.length === 0 ? 'Thinking...' : 'Get Suggestions'}
                        </button>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => setPrompt(s)} className="text-xs bg-violet-50 text-violet-700 px-3 py-1 rounded-full hover:bg-violet-100">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500">Advanced Context</h4>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={useOriginals} onChange={e => setUseOriginals(e.target.checked)} className="rounded text-violet-600" />
                                Include Original Subjects
                            </label>
                        </div>
                        <FileUploader label="Add Reference Image" image={refImg} onUpload={setRefImg} onClear={() => setRefImg(null)} />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => dispatch({ type: 'SET_MODAL', payload: { isOpen: false, baseImage: null, context: null } })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button
                        onClick={handleApply}
                        disabled={loading || !prompt}
                        className="px-6 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Spinner className="w-4 h-4 text-white" /> : <Wand2 size={16} />}
                        Apply Edit
                    </button>
                </div>
            </div>
        </div>
    );
};
