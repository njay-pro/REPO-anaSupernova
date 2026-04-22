import React from 'react';

export const MarkdownRenderer = ({ text }: { text: string }) => {
    if (typeof text !== 'string') return null;
    const parseText = (inputText: string) => {
        const codeBlockRegex = /```json([\s\S]*?)```|```([\s\S]*?)```/g;
        const parts = inputText.split(codeBlockRegex);
        if (parts.length === 1) return formatInline(inputText);
        return parts.map((part, index) => {
            if (index % 3 === 0) return <span key={index}>{formatInline(part)}</span>;
            else if (part) return <div key={index} className="bg-gray-800 text-gray-100 p-3 rounded-md my-2 text-xs font-mono overflow-x-auto"><pre>{part.trim()}</pre></div>;
            return null;
        });
    };
    const formatInline = (text: string) => {
        if (!text) return null;
        const boldParts = text.split(/\*\*(.*?)\*\*/g);
        return boldParts.map((part, i) => {
            if (i % 2 === 1) return <strong key={i} className="font-bold text-violet-900">{part}</strong>;
            return part.split('\n').map((line, j) => {
                const listMatch = line.match(/^\s*[-*]\s+(.*)/);
                if (listMatch) return <div key={`${i}-${j}`} className="flex gap-2 ml-2 my-1"><span className="text-violet-500">•</span><span>{listMatch[1]}</span></div>;
                return <span key={`${i}-${j}`}>{line}{j < part.split('\n').length - 1 ? <br /> : ''}</span>;
            });
        });
    };
    return <div className="markdown-content text-sm leading-relaxed">{parseText(text)}</div>;
};
