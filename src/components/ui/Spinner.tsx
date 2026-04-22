import React from 'react';

export const Spinner = ({ className = "w-5 h-5" }) => (
    <div className={`border-2 border-black/10 border-l-violet-600 rounded-full animate-spin ${className}`} />
);
