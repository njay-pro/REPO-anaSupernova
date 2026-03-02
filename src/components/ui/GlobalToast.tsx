"use client";
import React, { useContext, useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { StyleContext } from '@/context/StyleContext';

export const GlobalToast = () => {
    const { state, dispatch } = useContext(StyleContext);
    const { notification } = state;

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                dispatch({ type: 'SET_NOTIFICATION', payload: null });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [notification, dispatch]);

    if (!notification) return null;

    return (
        <div
            className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-2xl border-l-4 flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 ${notification.type === 'error'
                    ? 'bg-white border-red-500 text-red-800'
                    : 'bg-white border-emerald-500 text-emerald-800'
                }`}>
            {notification.type === 'error' ? <AlertCircle size={20} className="text-red-500" /> : <CheckCircle2 size={20} className="text-emerald-500" />}
            <span className="font-medium text-sm pr-2">{String(notification.message)}</span>
            <button onClick={() => dispatch({ type: 'SET_NOTIFICATION', payload: null })} className="ml-auto opacity-50 hover:opacity-100">
                <X size={14} />
            </button>
        </div>
    );
};
