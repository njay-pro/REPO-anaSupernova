"use client";
import React, { useContext, useEffect } from 'react';
import { Play, Trash2, Download, AlertCircle, Clock } from 'lucide-react';
import { StyleContext } from '@/context/StyleContext';
import { ApiService } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';

export const CinemaView = () => {
    const { state, dispatch } = useContext(StyleContext);

    useEffect(() => {
        const pollingIntervals: { [id: string]: NodeJS.Timeout } = {};

        (state.videos || []).forEach((video: any) => {
            if (video.status === 'loading' && video.operationName && !pollingIntervals[video.id]) {
                const poll = async () => {
                    try {
                        const status = await ApiService.checkVideoStatus(video.operationName);
                        if (status.done) {
                            const videoUri = status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
                            if (videoUri) {
                                dispatch({
                                    type: 'UPDATE_VIDEO',
                                    payload: {
                                        id: video.id,
                                        status: 'complete',
                                        videoUrl: videoUri
                                    }
                                });
                            } else {
                                throw new Error("Video generation completed but no URL was returned.");
                            }
                        }
                    } catch (e: any) {
                        console.error("Polling error for", video.id, e);
                        dispatch({
                            type: 'UPDATE_VIDEO',
                            payload: {
                                id: video.id,
                                status: 'failed',
                                error: e.message
                            }
                        });
                    }
                };

                // Initial check
                poll();
                // Set interval
                pollingIntervals[video.id] = setInterval(poll, 10000);
            }
        });

        return () => {
            Object.values(pollingIntervals).forEach(clearInterval);
        };
    }, [state.videos, dispatch]);

    const handleRemove = (id: string) => {
        dispatch({ type: 'REMOVE_VIDEO', payload: id });
    };

    if (!state.videos || state.videos.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <Play size={40} className="text-gray-300 ml-1" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Cinema Empty</h3>
                <p className="max-w-xs text-sm text-gray-500 mb-8 leading-relaxed">
                    Transform your generated images into cinematic 8-second videos. Go to the gallery to start generating.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 pb-24 grid grid-cols-1 gap-8 max-w-2xl mx-auto">
            <header className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-800">Your Productions</h2>
                <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Powered by Veo 3.1
                </span>
            </header>

            {(state.videos || []).map((video: any) => (
                <div key={video.id} className="bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="relative aspect-video bg-black flex items-center justify-center group">
                        {video.status === 'loading' ? (
                            <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                                <Spinner className="w-12 h-12 text-violet-400 mb-4" />
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock size={16} className="animate-pulse" />
                                    <span className="text-sm font-semibold">Synthesizing Scenes...</span>
                                </div>
                                <p className="text-[10px] text-gray-300 opacity-80 max-w-[200px] text-center">
                                    This can take between 1 to 5 minutes depending on volume.
                                </p>
                            </div>
                        ) : video.status === 'failed' ? (
                            <div className="absolute inset-0 z-10 bg-red-950/20 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                                <AlertCircle size={48} className="text-red-400 mb-4" />
                                <p className="font-bold text-lg mb-2 text-white">Production Error</p>
                                <p className="text-sm text-red-100 opacity-90 line-clamp-3 mb-6 bg-red-900/40 p-3 rounded-xl border border-red-500/30">
                                    {video.error || 'Failed to generate video.'}
                                </p>
                                <button
                                    onClick={() => handleRemove(video.id)}
                                    className="px-6 py-2.5 bg-white text-red-600 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all"
                                >
                                    Remove Production
                                </button>
                            </div>
                        ) : (
                            <video
                                src={video.videoUrl}
                                controls
                                poster={`data:image/png;base64,${video.poster}`}
                                className="w-full h-full object-contain"
                            />
                        )}
                        {!video.videoUrl && video.poster && (
                            <img
                                src={`data:image/png;base64,${video.poster}`}
                                alt="Poster"
                                className={`w-full h-full object-cover opacity-60 ${video.status === 'loading' ? 'grayscale sm:blur-[2px]' : ''}`}
                            />
                        )}
                    </div>

                    <div className="p-5 flex items-center justify-between bg-white">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Source Production</span>
                            <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">
                                {video.prompt?.substring(0, 30)}...
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {video.videoUrl && (
                                <a
                                    href={video.videoUrl}
                                    download={`ana-reel-${video.id}.mp4`}
                                    className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-violet-50 hover:text-violet-600 transition-all border border-transparent hover:border-violet-100"
                                    title="Download Video"
                                >
                                    <Download size={20} />
                                </a>
                            )}
                            <button
                                onClick={() => handleRemove(video.id)}
                                className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                title="Delete Production"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <div className="mt-8 p-6 bg-violet-50 rounded-3xl border border-violet-100 flex items-start gap-4">
                <div className="p-2 bg-violet-600 rounded-xl text-white">
                    <Play size={20} fill="currentColor" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-violet-900 mb-1">Directing Tip</h4>
                    <p className="text-xs text-violet-700 leading-relaxed opacity-80">
                        Veo 3.1 creates 8-second cinematic shots. The anchor image preserves the subject's look while the AI imagines the movement, audio, and cinematic flow.
                    </p>
                </div>
            </div>
        </div>
    );
};
