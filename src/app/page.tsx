"use client";
import React, { useContext, useEffect } from 'react';
import { Settings, MessageSquare, Layers, Play } from 'lucide-react';
import { StyleProvider, StyleContext } from '@/context/StyleContext';
import { SetupView } from '@/components/SetupView';
import { GalleryView } from '@/components/GalleryView';
import { ChatView } from '@/components/ChatView';
import { EditModal } from '@/components/ui/EditModal';
import { GlobalToast } from '@/components/ui/GlobalToast';
import { Spinner } from '@/components/ui/Spinner';
import { ApiService } from '@/lib/api';

const AppContent = () => {
  const { state, dispatch } = useContext(StyleContext);

  const handleGenerate = async (overrides: any = {}) => {
    // Merge current state with overrides (important for concurrent tool calls)
    const currentState = { ...state, ...overrides };

    if (!currentState.subject1 || Object.keys(currentState.activeStyleJson).length === 0) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Missing Subject or Style Description", type: 'error' } });
      return;
    }

    dispatch({ type: 'SET_VIEW', payload: 'gallery' });

    const tempId = typeof crypto !== 'undefined' ? crypto.randomUUID() : (Date.now() + Math.random()).toString(); // Bulletproof ID for parallel batch calls
    dispatch({
      type: 'ADD_GALLERY_ITEM',
      payload: {
        id: tempId,
        status: 'loading',
        image: null,
        json: JSON.stringify(currentState.activeStyleJson),
        sub1: currentState.subject1,
        sub2: currentState.subject2,
        type: 'generated'
      }
    });

    try {
      const images = [currentState.subject1];
      if (currentState.subject2) images.push(currentState.subject2);
      if (currentState.useExtractedBg && currentState.extractedBg) images.push(currentState.extractedBg);
      if (currentState.useExtractedOutfit && currentState.extractedOutfit) images.push(currentState.extractedOutfit);

      const res = await ApiService.generateCall('', images, currentState.selectedModel, {
        promptKey: 'generate-image',
        params: { activeStyleJson: currentState.activeStyleJson }
      });
      const candidate = res.candidates?.[0];
      const data = candidate?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      const thoughtPart = candidate?.content?.parts?.find((p: any) => p.thoughtSignature || p.thought_signature);
      const signature = thoughtPart ? (thoughtPart.thoughtSignature || thoughtPart.thought_signature) : null;

      if (data) {
        dispatch({
          type: 'UPDATE_GALLERY_ITEM',
          payload: {
            id: tempId,
            image: data,
            thoughtSignature: signature,
            status: 'complete'
          }
        });
        dispatch({ type: 'SET_NOTIFICATION', payload: { message: "Masterpiece Generated!", type: 'success' } });
      } else {
        throw new Error("No image data returned");
      }
    } catch (e: any) {
      dispatch({ type: 'REMOVE_GALLERY_ITEM', payload: tempId });
      dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Generation failed: ${e.message}`, type: 'error' } });
    }
  };

  // Expose handleGenerate to the context or a shared ref if needed, 
  // but for now we'll pass it down or handle it in ChatView separately.
  // Actually, let's put it in the context so it's globally available.
  useEffect(() => {
    dispatch({ type: 'REGISTER_GENERATE', payload: handleGenerate });
  }, [state.activeStyleJson, state.subject1, state.subject2, state.selectedModel]);

  return (
    <div className="h-screen bg-gray-100 text-gray-900 font-sans overflow-hidden flex flex-col relative w-full">
      <GlobalToast />
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 py-3 px-4 z-10 flex justify-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
          ana Style Transfer Machine
        </h1>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full overflow-y-auto ${state.view === 'setup' ? 'block' : 'hidden'}`}>
          <SetupView />
        </div>
        <div className={`h-full overflow-y-auto ${state.view === 'gallery' ? 'block' : 'hidden'}`}>
          <GalleryView />
        </div>
        <div className={`h-full ${state.view === 'chat' ? 'block' : 'hidden'}`}>
          <ChatView />
        </div>
        {state.loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-in fade-in">
            <Spinner className="w-12 h-12 text-violet-600 mb-4" />
            <p className="text-lg font-medium text-gray-700">{String(state.loadingMessage)}</p>
          </div>
        )}
      </main>
      {state.view === 'setup' && (
        <div className="absolute bottom-[60px] left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent z-20 pointer-events-none flex justify-center">
          <button
            onClick={handleGenerate}
            className="pointer-events-auto w-full max-w-md bg-violet-700 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-violet-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play fill="currentColor" size={16} /> Apply Style Transfer
          </button>
        </div>
      )}
      <nav className="h-[60px] bg-white border-t border-gray-200 grid grid-cols-3 z-30 shrink-0 mt-auto">
        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'setup' })} className={`flex flex-col items-center justify-center gap-1 ${state.view === 'setup' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Settings size={20} />
          <span className="text-[10px] font-medium">Setup</span>
        </button>
        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'chat' })} className={`flex flex-col items-center justify-center gap-1 ${state.view === 'chat' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <MessageSquare size={20} />
          <span className="text-[10px] font-medium">Assistant</span>
        </button>
        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'gallery' })} className={`flex flex-col items-center justify-center gap-1 relative ${state.view === 'gallery' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Layers size={20} />
          <span className="text-[10px] font-medium">Gallery</span>
          {state.gallery.length > 0 && <span className="absolute top-2 right-8 w-2 h-2 bg-red-500 rounded-full" />}
        </button>
      </nav>
      <EditModal />
    </div>
  );
};

export default function App() {
  return (
    <StyleProvider>
      <AppContent />
    </StyleProvider>
  );
}
