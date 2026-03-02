"use client";
import React, { useState, useContext } from 'react';
import { Sparkles, User, Webhook, Edit3 } from 'lucide-react';
import { StyleContext } from '@/context/StyleContext';
import { ApiService } from '@/lib/api';
import { JSON_STRUCTURE } from '@/lib/prompt-schemas';
import { FileUploader } from '@/components/ui/FileUploader';
import { HybridSlot } from '@/components/ui/HybridSlot';
import { AccordionGroup } from '@/components/ui/AccordionGroup';
import { Spinner } from '@/components/ui/Spinner';

export const SetupView = () => {
    const { state, dispatch } = useContext(StyleContext);
    const [isExtractingDesc, setIsExtractingDesc] = useState(false);
    const [bgLoading, setBgLoading] = useState(false);
    const [outfitLoading, setOutfitLoading] = useState(false);
    const [sendingWebhook, setSendingWebhook] = useState(false);

    const handleGenerateDescription = async () => {
        if (!state.reference) return dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Upload reference first", type: 'error' } });
        setIsExtractingDesc(true);
        try {
            const res = await ApiService.generateCall('', [state.reference], 'gemini-3-flash-preview', {
                promptKey: 'style-extraction',
                params: { jsonStructure: JSON_STRUCTURE }
            });
            const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
            const json = ApiService.extractJson(text);
            if (json) {
                dispatch({ type: 'SET_STYLE_JSON', payload: json, full: json });
                dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Style analyzed successfully!", type: 'success' } });
            }
        } catch (e) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Extraction failed. Try again.", type: 'error' } });
        } finally {
            setIsExtractingDesc(false);
        }
    };

    const handleElementExtraction = async (type: 'background' | 'outfit') => {
        if (!state.reference) return dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Upload reference first", type: 'error' } });
        const isBg = type === 'background';
        const setter = isBg ? setBgLoading : setOutfitLoading;
        setter(true);
        try {
            const res = await ApiService.generateCall('', [state.reference], state.selectedModel, {
                promptKey: isBg ? 'bg-extraction' : 'outfit-extraction'
            });
            const imgData = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
            if (imgData) {
                dispatch({ type: 'SET_ASSET', key: isBg ? 'extractedBg' : 'extractedOutfit', payload: imgData });
                dispatch({ type: 'SET_ASSET', key: isBg ? 'useExtractedBg' : 'useExtractedOutfit', payload: true });
                dispatch({ type: 'SET_NOTIFICATION', payload: { message: `${isBg ? 'Background' : 'Outfit'} extracted successfully!`, type: 'success' } });
            }
        } catch (e) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Failed to extract element.", type: 'error' } });
        } finally {
            setter(false);
        }
    };

    const handleSendToWebhook = async () => {
        const url = state.webhookMode === 'test' ? process.env.NEXT_PUBLIC_WEBHOOK_URL_TEST : process.env.NEXT_PUBLIC_WEBHOOK_URL_PROD;
        // Note: Next.js exposes NEXT_PUBLIC_ vars to browser. If they are secret, we should proxy it via an API route. 
        // Here we'll just proxy the webhook through our own API if needed, or if it's fine exposing N8N webhook, we keep it NEXT_PUBLIC.
        // For this context, standard behavior is fetch directly since it was client-side before.
        if (!url) return dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Webhook URL not configured", type: 'error' } });

        setSendingWebhook(true);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.activeStyleJson)
            });
            if (response.ok) {
                dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Sent to ${state.webhookMode.toUpperCase()} successfully!`, type: 'success' } });
            } else {
                throw new Error(response.statusText);
            }
        } catch (e: any) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Webhook Failed: ${e.message}`, type: 'error' } });
        } finally {
            setSendingWebhook(false);
        }
    };

    const hasStyle = Object.keys(state.activeStyleJson).length > 0;

    return (
        <div className="p-4 sm:p-6 pb-24 space-y-8 max-w-2xl mx-auto">
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs">1</div>
                        Assets
                    </h2>
                    <select
                        className="text-sm bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus:ring-violet-500"
                        value={state.selectedModel}
                        onChange={(e) => dispatch({ type: 'SET_MODEL', payload: e.target.value })}
                    >
                        <option value="nano-banana-pro">Nano Banana Pro</option>
                        <option value="nano-banana-2">Nano Banana 2 (Default)</option>
                        <option value="nano-banana">Nano Banana</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUploader
                        label="Subject 1"
                        image={state.subject1}
                        onUpload={(d) => dispatch({ type: 'SET_ASSET', key: 'subject1', payload: d })}
                        onClear={() => dispatch({ type: 'SET_ASSET', key: 'subject1', payload: null })}
                    />
                    <FileUploader
                        label="Subject 2 (Opt)"
                        image={state.subject2}
                        onUpload={(d) => dispatch({ type: 'SET_ASSET', key: 'subject2', payload: d })}
                        onClear={() => dispatch({ type: 'SET_ASSET', key: 'subject2', payload: null })}
                        onAction={async () => {
                            if (!state.subject2) return;
                            try {
                                const res = await ApiService.generateCall('', [state.subject2], state.selectedModel, {
                                    promptKey: 'subject-extraction'
                                });
                                const img = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
                                if (img) {
                                    dispatch({ type: 'SET_ASSET', key: 'subject2', payload: img });
                                    dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Subject extracted!", type: 'success' } });
                                }
                            } catch (e) { dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Extraction failed", type: 'error' } }); }
                        }}
                        actionIcon={User}
                        actionTitle="Extract Subject"
                    />
                </div>
                <FileUploader
                    label="Style Reference"
                    image={state.reference}
                    onUpload={(d) => {
                        dispatch({ type: 'SET_ASSET', key: 'reference', payload: d });
                        dispatch({ type: 'SET_STYLE_JSON', payload: {} });
                    }}
                    onClear={() => dispatch({ type: 'SET_ASSET', key: 'reference', payload: null })}
                />
                <button
                    onClick={handleGenerateDescription}
                    disabled={!state.reference || isExtractingDesc}
                    className="w-full py-3 bg-violet-50 text-violet-700 font-medium rounded-xl hover:bg-violet-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {isExtractingDesc ? <Spinner /> : <Sparkles size={18} />}
                    {hasStyle ? 'Re-Analyze Style' : 'Generate Style Description'}
                </button>
            </section>
            <section className={`space-y-4 transition-all duration-300 ${!state.reference ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs">2</div>
                    Style Hub
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <HybridSlot
                        type="background"
                        image={state.extractedBg}
                        isLoading={bgLoading}
                        isChecked={state.useExtractedBg}
                        onToggle={(v) => dispatch({ type: 'SET_ASSET', key: 'useExtractedBg', payload: v })}
                        onUpload={(d) => {
                            dispatch({ type: 'SET_ASSET', key: 'extractedBg', payload: d });
                            dispatch({ type: 'SET_ASSET', key: 'useExtractedBg', payload: true });
                        }}
                        onExtract={() => handleElementExtraction('background')}
                        onClear={() => {
                            dispatch({ type: 'SET_ASSET', key: 'extractedBg', payload: null });
                            dispatch({ type: 'SET_ASSET', key: 'useExtractedBg', payload: false });
                        }}
                        hasJson={!!state.fullStyleJson.background}
                        onExtractJson={() => dispatch({ type: 'UPDATE_STYLE_PARAM', group: 'background', key: 'transfer', value: JSON.stringify(state.fullStyleJson.background) })}
                    />
                    <HybridSlot
                        type="outfit"
                        image={state.extractedOutfit}
                        isLoading={outfitLoading}
                        isChecked={state.useExtractedOutfit}
                        onToggle={(v) => dispatch({ type: 'SET_ASSET', key: 'useExtractedOutfit', payload: v })}
                        onUpload={(d) => {
                            dispatch({ type: 'SET_ASSET', key: 'extractedOutfit', payload: d });
                            dispatch({ type: 'SET_ASSET', key: 'useExtractedOutfit', payload: true });
                        }}
                        onExtract={() => handleElementExtraction('outfit')}
                        onClear={() => {
                            dispatch({ type: 'SET_ASSET', key: 'extractedOutfit', payload: null });
                            dispatch({ type: 'SET_ASSET', key: 'useExtractedOutfit', payload: false });
                        }}
                        hasJson={!!state.fullStyleJson.outfit}
                        onExtractJson={() => dispatch({ type: 'UPDATE_STYLE_PARAM', group: 'outfit', key: 'transfer', value: JSON.stringify(state.fullStyleJson.outfit) })}
                    />
                </div>
                {hasStyle && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Edit3 size={16} /> Style Editor</h3>
                            <div className="flex items-center gap-2">
                                <select
                                    value={state.webhookMode}
                                    onChange={(e) => dispatch({ type: 'SET_WEBHOOK_MODE', payload: e.target.value })}
                                    className="text-xs bg-gray-100 border-none rounded-lg py-1.5 pl-2 pr-1 text-gray-600 font-medium focus:ring-2 focus:ring-violet-100 cursor-pointer outline-none"
                                >
                                    <option value="prod">Prod</option>
                                    <option value="test">Test</option>
                                </select>
                                <button
                                    onClick={handleSendToWebhook}
                                    disabled={sendingWebhook}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors ${state.webhookMode === 'test'
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        }`}
                                    title={`Send JSON to n8n ${state.webhookMode.toUpperCase()}`}
                                >
                                    {sendingWebhook ? <Spinner className="w-3 h-3" /> : <Webhook size={12} />}
                                    Send
                                </button>
                            </div>
                        </div>
                        {Object.keys(state.activeStyleJson).map((group) => (
                            <AccordionGroup
                                key={group}
                                title={group}
                                data={state.activeStyleJson[group]}
                                onUpdate={(g, k, v) => dispatch({ type: 'UPDATE_STYLE_PARAM', group: g, key: k, value: v })}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
