
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { User } from '@/lib/data';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Mic, MicOff, Phone, PhoneOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Call {
  caller: User;
  callee: User;
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
                            <p className="text-sm text-muted-foreground">Incoming audio call...</p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="destructive" size="icon" onClick={onDecline}>
                            <PhoneOff />
                        </Button>
                        <Button variant="default" size="icon" className="bg-green-500 hover:bg-green-600" onClick={onAccept}>
                            <Phone />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ActiveCall = ({ call, onEnd, localStream, remoteStream }: { call: Call; onEnd: () => void; localStream: MediaStream | null, remoteStream: MediaStream | null; }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (localAudioRef.current && localStream) {
            localAudioRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteAudioRef.current && remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
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

    return (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-2xl animate-in fade-in-0 zoom-in-95">
                <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center gap-6">
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-primary">
                        <AvatarImage src={otherUser.avatar} />
                        <AvatarFallback className="text-3xl sm:text-4xl">{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold">{otherUser.name}</p>
                        <p className="text-muted-foreground">{call.status === 'ringing' ? 'Ringing...' : formatDuration(duration)}</p>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>End-to-end encrypted</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn("rounded-full h-12 w-12 sm:h-14 sm:w-14", isMuted && "bg-primary text-primary-foreground")}
                            onClick={handleMuteToggle}
                        >
                            {isMuted ? <MicOff /> : <Mic />}
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-full h-14 w-14 sm:h-16 sm:w-16"
                            onClick={onEnd}
                        >
                            <PhoneOff size={28} />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <audio ref={localAudioRef} autoPlay muted playsInline />
            <audio ref={remoteAudioRef} autoPlay playsInline />
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
