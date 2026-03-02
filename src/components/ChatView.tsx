"use client";
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, MessageSquare, Cpu, Database, Edit3, Play, Library, Terminal, BrainCircuit } from 'lucide-react';
import { StyleContext } from '@/context/StyleContext';
import { ApiService } from '@/lib/api';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

const ToolMessage = ({ toolName, result }: { toolName: string, result: string }) => (
    <div className="flex justify-center w-full my-3 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs shadow-sm max-w-[90%]">
            {toolName === 'ana_style_library' ?
                <Library size={14} className="text-violet-500 shrink-0" /> :
                toolName === 'edit_description' ?
                    <Edit3 size={14} className="text-emerald-500 shrink-0" /> :
                    toolName === 'generate_image' ?
                        <Play size={14} className="text-pink-500 shrink-0" /> :
                        toolName === 'get_description' ?
                            <Database size={14} className="text-orange-500 shrink-0" /> :
                            toolName === 'thinking' ?
                                <BrainCircuit size={14} className="text-amber-500 shrink-0" /> :
                                <Terminal size={14} className="text-blue-500 shrink-0" />
            }
            <span className="font-semibold text-gray-700 whitespace-nowrap">{toolName === 'thinking' ? 'Reasoning' : toolName}</span>
            <span className="text-gray-300">|</span>
            <span className="truncate">{String(result)}</span>
        </div>
    </div>
);

export const ChatView = () => {
    const { state, dispatch } = useContext(StyleContext);
    const [input, setInput] = useState('');
    const [filteredCommands, setFilteredCommands] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

    const SLASH_COMMANDS = [
        { cmd: '/outfit', text: "Let's alternate the outfit", desc: "Alternate outfit" },
        { cmd: '/bg', text: "Let's change the background", desc: "Change background" },
        { cmd: '/lighting', text: "Let's adjust the lighting", desc: "Adjust lighting" },
        { cmd: '/pose', text: "Let's alternate the pose", desc: "Change pose" },
        { cmd: '/hand', text: "Let's fix the hand gesture", desc: "Fix hands" },
        { cmd: '/photography', text: "Let's change the photography style", desc: "Change photo style" },
        { cmd: '/angle', text: "Let's change the camera angle", desc: "Change angle" },
        { cmd: '/expression', text: "Let's change the facial expression", desc: "Change expression" },
        { cmd: '/search', text: "Search Ana's Library for ", desc: "Search Pinecone DB" },
        { cmd: '/generate', text: "Go ahead and generate the image", desc: "Trigger Generation" }
    ];

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [state.messages, isTyping]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands]);

    useEffect(() => {
        if (itemsRef.current[selectedIndex]) {
            itemsRef.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    const applySlashCommand = (command: any) => {
        setInput(command.text);
        setFilteredCommands([]);
        document.getElementById('chat-input')?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        if (val.startsWith('/')) {
            const query = val.slice(1).toLowerCase();
            const matches = SLASH_COMMANDS.filter(c => c.cmd.toLowerCase().includes(query));
            setFilteredCommands(matches);
        } else {
            setFilteredCommands([]);
        }
    };

    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const executeTool = async (toolName: string, args: any) => {
        console.log("Executing Tool:", toolName, args);
        switch (toolName) {
            case 'get_description':
                return { message: JSON.stringify(stateRef.current.activeStyleJson) };
            case 'edit_description': {
                const currentJson = { ...stateRef.current.activeStyleJson };
                const merge = (target: any, source: any) => {
                    for (const key in source) {
                        if (source[key] instanceof Object && key in target) Object.assign(source[key], merge(target[key], source[key]));
                    }
                    Object.assign(target || {}, source);
                    return target;
                };
                merge(currentJson, args);
                // Immediately update local ref to ensure parallel tools in same loop see this update
                stateRef.current = { ...stateRef.current, activeStyleJson: currentJson };
                dispatch({ type: 'SET_STYLE_JSON', payload: currentJson });
                return { message: "Style updated successfully." };
            }
            case 'ana_style_library':
                try {
                    const results = await ApiService.searchPinecone(args.query);
                    const matches = results.matches?.map((m: any) => m.metadata).filter(Boolean) || [];
                    if (matches.length === 0) return { message: "No matches found in library." };
                    return { message: `Found styles: ${JSON.stringify(matches.slice(0, 2))}` };
                } catch (e: any) {
                    return { message: `Error searching library: ${e.message}` };
                }
            case 'generate_image':
                if (stateRef.current.generateFn) {
                    // Pass the latest activeStyleJson explicitly to override any stale closures in generateFn
                    stateRef.current.generateFn({ activeStyleJson: stateRef.current.activeStyleJson });
                    return { message: "Image generation triggered." };
                }
                return { message: "Error: Generation function not registered." };
            default: return { message: "Error: Unknown tool." };
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setFilteredCommands([]);
        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', text: userMsg } });
        setIsTyping(true);

        const history = stateRef.current.messages.map((m: any) => {
            const part: any = { text: m.text };
            if (m.thoughtSignature) part.thoughtSignature = m.thoughtSignature;
            return { role: m.role === 'assistant' ? 'model' : 'user', parts: [part] };
        });

        history.push({ role: 'user', parts: [{ text: userMsg }] });

        let turns = 0;
        const MAX_TURNS = 30;

        const processTurn = async (currentHistory: any[]) => {
            if (turns >= MAX_TURNS) {
                setIsTyping(false);
                return;
            }
            turns++;

            try {
                const chatRes = await ApiService.chatCall(currentHistory, state.chatModel);
                const candidate = chatRes.candidates?.[0];
                const content = candidate?.content;

                if (!content) throw new Error("Empty response from model");

                const parts = content.parts || [];

                const thoughtPart = parts.find((p: any) => p.thoughtSignature || p.thought_signature);
                if (thoughtPart) {
                    const signature = thoughtPart.thoughtSignature || thoughtPart.thought_signature;
                    dispatch({
                        type: 'ADD_MESSAGE',
                        payload: {
                            role: 'system',
                            text: `Thought Signature Captured: ${signature.substring(0, 20)}...`,
                            toolName: 'thinking',
                            isToolMessage: true
                        }
                    });
                }

                const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

                if (functionCalls.length > 0) {
                    currentHistory.push(content);
                    const responses = [];
                    for (const call of functionCalls) {
                        dispatch({
                            type: 'ADD_MESSAGE',
                            payload: {
                                role: 'system',
                                text: `Calling: ${call.name}`,
                                toolName: call.name,
                                isToolMessage: true
                            }
                        });
                        const result = await executeTool(call.name, call.args);
                        dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Tool ${call.name} finished`, type: 'success' } });
                        responses.push({
                            functionResponse: {
                                name: call.name,
                                response: { result: result.message }
                            }
                        });
                    }
                    const responseMessage = { role: 'user', parts: responses };
                    currentHistory.push(responseMessage);
                    await processTurn(currentHistory);
                } else {
                    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('');
                    if (textParts) {
                        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', text: textParts } });
                    }
                    setIsTyping(false);
                }
            } catch (e) {
                console.error("Agent Loop Error:", e);
                dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', text: "Sorry, I encountered an error executing the plan." } });
                setIsTyping(false);
            }
        };
        await processTurn(history);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (filteredCommands.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                applySlashCommand(filteredCommands[selectedIndex]);
                return;
            }
        }
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
            <div className="px-4 pt-3 flex justify-end">
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm border border-gray-100">
                    <Cpu size={14} className="text-violet-500" />
                    <span className="text-xs font-bold text-gray-700">Gemini 3.0 Flash (Preview)</span>
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
                {state.messages.filter((m: any) => !m.isHidden).map((msg: any, i: number) => {
                    if (msg.isToolMessage) {
                        return <ToolMessage key={i} toolName={msg.toolName} result={msg.text} />;
                    }
                    return (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                                }`}>
                                <MarkdownRenderer text={msg.text} />
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200 flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                        </div>
                    </div>
                )}
            </div>
            <div className="absolute bottom-6 left-0 right-0 px-4 z-20">
                <div className="max-w-2xl mx-auto relative">
                    {filteredCommands.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden max-h-60 overflow-y-auto">
                            {filteredCommands.map((cmd, i) => (
                                <button
                                    key={cmd.cmd}
                                    ref={el => { itemsRef.current[i] = el; }}
                                    onClick={() => applySlashCommand(cmd)}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    className={`w-full text-left px-4 py-3 flex justify-between items-center transition-colors ${i === selectedIndex ? 'bg-violet-100/80' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold text-violet-700 text-sm">{cmd.cmd}</span>
                                        <span className="text-xs text-gray-600">{cmd.desc}</span>
                                    </div>
                                    {i === selectedIndex && <span className="text-xs text-violet-500 font-mono font-bold">↵ Select</span>}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="relative flex items-center gap-2 bg-white rounded-full shadow-2xl shadow-violet-900/10 border border-gray-100 p-1.5 transition-transform focus-within:scale-[1.01]">
                        <div className="pl-4 pr-2 text-gray-400">
                            <MessageSquare size={20} />
                        </div>
                        <input
                            id="chat-input"
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Ana to edit style or type / for tools..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-sm py-2.5 outline-none"
                            autoComplete="off"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-md transform active:scale-95"
                        >
                            <Send size={18} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
