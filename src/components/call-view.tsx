
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { User } from '@/lib/data';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Mic, MicOff, Phone, PhoneOff, Lock, Video, VideoOff, Camera, CameraOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Call {
  caller: User;
  callee: User;
  type: 'audio' | 'video';
  status: 'ringing' | 'active' | 'declined' | 'ended';
}

interface CallViewProps {
  activeCall: Call | null;
  incomingCall: Call | null;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const IncomingCall = ({ call, onAccept, onDecline }: { call: Call; onAccept: () => void; onDecline: () => void; }) => {
    return (
        <div className="fixed bottom-5 right-5 z-50">
            <Card className="w-80 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={call.caller.avatar} />
                            <AvatarFallback>{call.caller.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{call.caller.name}</p>
                            <p className="text-sm text-muted-foreground">Incoming {call.type} call...</p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="destructive" size="icon" onClick={onDecline}>
                            <PhoneOff />
                        </Button>
                        <Button variant="default" size="icon" className="bg-green-500 hover:bg-green-600" onClick={onAccept}>
                            {call.type === 'video' ? <Video /> : <Phone />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ActiveCall = ({ call, onEnd, localStream, remoteStream }: { call: Call; onEnd: () => void; localStream: MediaStream | null, remoteStream: MediaStream | null; }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(call.type === 'audio');
    const [duration, setDuration] = useState(0);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };
    
    const otherUser = call.callee;

    const handleMuteToggle = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };
    
    const handleCameraToggle = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(!isCameraOff);
        }
    };
    
    return (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full h-full relative">
                {/* Remote Video */}
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover rounded-lg" />
                
                {/* Local Video */}
                <video ref={localVideoRef} autoPlay playsInline muted className={cn(
                    "absolute top-4 right-4 h-1/4 w-auto rounded-lg shadow-lg border-2 border-primary",
                    isCameraOff && "hidden"
                )} />

                 {/* Fallback Avatar when video is off */}
                 {isCameraOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/50">
                        <Avatar className="h-28 w-28 border-4 border-primary">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback className="text-4xl">{otherUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                         <div className="text-center">
                            <p className="text-2xl font-bold">{otherUser.name}</p>
                            <p className="text-muted-foreground">{call.status === 'ringing' ? 'Ringing...' : formatDuration(duration)}</p>
                        </div>
                    </div>
                )}


                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-background bg-foreground/50 px-2 py-1 rounded-full">
                        <Lock className="h-3 w-3" />
                        <span>End-to-end encrypted</span>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn("rounded-full h-14 w-14", isMuted && "bg-primary text-primary-foreground")}
                            onClick={handleMuteToggle}
                        >
                            {isMuted ? <MicOff /> : <Mic />}
                        </Button>
                        
                         {call.type === 'video' && (
                            <Button
                                variant="outline"
                                size="icon"
                                className={cn("rounded-full h-14 w-14", isCameraOff && "bg-primary text-primary-foreground")}
                                onClick={handleCameraToggle}
                            >
                                {isCameraOff ? <CameraOff /> : <Camera />}
                            </Button>
                        )}

                        <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-full h-16 w-16"
                            onClick={onEnd}
                        >
                            <PhoneOff size={28} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export function CallView({ activeCall, incomingCall, onAccept, onDecline, onEnd, localStream, remoteStream }: CallViewProps) {
    if (activeCall) {
        return <ActiveCall call={activeCall} onEnd={onEnd} localStream={localStream} remoteStream={remoteStream} />;
    }
    if (incomingCall) {
        return <IncomingCall call={incomingCall} onAccept={onAccept} onDecline={onDecline} />;
    }
    return null;
}
