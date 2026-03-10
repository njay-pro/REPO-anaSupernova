"use client";
import React, { createContext, useReducer, ReactNode } from 'react';

export const StyleContext = createContext<any>(null);

const initialState = {
    view: 'setup',
    loading: false,
    loadingMessage: '',
    selectedModel: 'nano-banana-2',
    chatModel: 'gemini-3-flash-preview',
    aspectRatio: '1:1',
    notification: null,
    subject1: null,
    subject2: null,
    reference: null,
    extractedBg: null,
    useExtractedBg: false,
    extractedOutfit: null,
    useExtractedOutfit: false,
    fullStyleJson: {},
    activeStyleJson: {},
    gallery: [],
    videos: [],
    messages: [{ role: 'assistant', text: "Hi! I'm your Agentic Style Assistant. I can plan, research the library, and edit styles for you.", isHidden: false }],
    editModal: { isOpen: false, baseImage: null, context: null },
    generateFn: null
};

const reducer = (state: any, action: any) => {
    switch (action.type) {
        case 'SET_VIEW': return { ...state, view: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload, loadingMessage: action.message || '' };
        case 'SET_NOTIFICATION': return { ...state, notification: action.payload };
        case 'SET_MODEL': return { ...state, selectedModel: action.payload };
        case 'SET_CHAT_MODEL': return { ...state, chatModel: action.payload };
        case 'SET_ASPECT_RATIO': return { ...state, aspectRatio: action.payload };
        case 'SET_ASSET': return { ...state, [action.key]: action.payload };
        case 'SET_STYLE_JSON': return { ...state, activeStyleJson: action.payload, fullStyleJson: action.full || state.fullStyleJson };
        case 'UPDATE_STYLE_PARAM': {
            const newJson = { ...state.activeStyleJson };
            if (!newJson[action.group]) newJson[action.group] = {};
            newJson[action.group][action.key] = action.value;
            return { ...state, activeStyleJson: newJson };
        }
        case 'ADD_GALLERY_ITEM': return { ...state, gallery: [action.payload, ...state.gallery] };
        case 'UPDATE_GALLERY_ITEM':
            return {
                ...state,
                gallery: state.gallery.map((item: any) =>
                    item.id === action.payload.id ? { ...item, ...action.payload } : item
                )
            };
        case 'REMOVE_GALLERY_ITEM': return { ...state, gallery: state.gallery.filter((item: any) => item.id !== action.payload) };
        case 'ADD_VIDEO': return { ...state, videos: [action.payload, ...state.videos] };
        case 'UPDATE_VIDEO':
            return {
                ...state,
                videos: state.videos.map((v: any) =>
                    v.id === action.payload.id ? { ...v, ...action.payload } : v
                )
            };
        case 'REMOVE_VIDEO': return { ...state, videos: state.videos.filter((v: any) => v.id !== action.payload) };
        case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
        case 'CLEAR_MESSAGES': return { ...state, messages: [{ role: 'assistant', text: "Chat cleared. Fresh start — what are we creating?", isHidden: false }] };
        case 'SET_MODAL': return { ...state, editModal: action.payload };
        case 'REGISTER_GENERATE': return { ...state, generateFn: action.payload };
        case 'LOAD_CHAT_CONTEXT': {
            const hasSignature = !!action.payload.signature;
            return {
                ...state,
                activeStyleJson: action.payload.json || state.activeStyleJson,
                view: 'chat',
                messages: [
                    { role: 'user', text: "I want to refine the style of this previously generated image." },
                    {
                        role: 'assistant',
                        text: hasSignature
                            ? "Ready. I have loaded the style context and reasoning."
                            : "Ready. I have loaded the style context (No reasoning trace found, but we can proceed).",
                        thoughtSignature: action.payload.signature
                    }
                ]
            };
        }
        default: return state;
    }
};

export const StyleProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <StyleContext.Provider value={{ state, dispatch }}>
            {children}
        </StyleContext.Provider>
    );
};
