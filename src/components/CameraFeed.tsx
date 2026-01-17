import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface CameraFeedProps {
  onGestureDetected?: (text: string) => void;
  alphabetScanMode?: boolean;
  sessionId?: string | null;
}

const CameraFeed = ({ onGestureDetected, alphabetScanMode = false, sessionId }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recentPredictions, setRecentPredictions] = useState<string[]>([]);
  const [lockedLetter, setLockedLetter] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Show a letter and hold still...");
  const [noHandTimer, setNoHandTimer] = useState<number>(0);
  const noHandTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsActive(true);
      toast.success("Camera activated");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
      toast.info("Camera deactivated");
    }
  };

  const toggleCamera = async () => {
    if (stream) {
      stopCamera();
    }
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  useEffect(() => {
    if (facingMode && !stream) {
      // Auto-restart camera after toggle
      const timer = setTimeout(() => {
        if (!isActive) {
          startCamera();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [facingMode]);

  const captureAndProcessFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isActive || isProcessing) return;
    if (alphabetScanMode && lockedLetter) return; // Don't process if letter is locked

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip horizontally if using front camera
    if (facingMode === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const frameData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      setIsProcessing(true);
      const { data, error } = await supabase.functions.invoke('detect-gesture', {
        body: { 
          frame: frameData, 
          alphabetMode: alphabetScanMode,
          session_id: sessionId 
        }
      });

      if (error) throw error;

      if (alphabetScanMode) {
        // Alphabet scan mode logic
        if (data?.gesture === "No hand detected") {
          setStatus("Move your hand closer and keep it inside the frame");
          
          // Start or increment no-hand timer
          if (noHandTimerRef.current) {
            clearTimeout(noHandTimerRef.current);
          }
          noHandTimerRef.current = setTimeout(() => {
            setNoHandTimer((prev: number) => prev + 1);
          }, 1000);
          
          setRecentPredictions([]);
        } else if (data?.stable) {
          // Letter locked in!
          setLockedLetter(data.gesture);
          setStatus(`Detected: ${data.gesture}`);
          if (onGestureDetected) {
            onGestureDetected(data.gesture);
          }
          setRecentPredictions([]);
        } else if (data?.gesture) {
          // Update rolling window
          setRecentPredictions(prev => {
            const updated = [...prev, data.gesture];
            if (updated.length > 10) updated.shift();
            
            // Count occurrences
            const counts = updated.reduce((acc, val) => {
              acc[val] = (acc[val] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const countValues = Object.values(counts) as number[];
            const maxCount = countValues.length > 0 ? Math.max(...countValues) : 0;
            const isStable = maxCount >= 7 && data.confidence >= 0.8;
            
            if (isStable) {
              setStatus(`Stabilizing... (${maxCount}/10)`);
            } else {
              setStatus("Hold still...");
            }
            
            return updated;
          });
          
          // Clear no-hand timer
          if (noHandTimerRef.current) {
            clearTimeout(noHandTimerRef.current);
            setNoHandTimer(0);
          }
        }
      } else {
        // Normal phrase mode
        if (data?.detectedSign && onGestureDetected) {
          onGestureDetected(data.detectedSign);
          console.log('Detected sign:', data.detectedSign, 'Confidence:', data.confidence);
        }
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      setStatus("Error processing frame");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanNext = () => {
    setLockedLetter(null);
    setRecentPredictions([]);
    setStatus("Show a letter and hold still...");
    setNoHandTimer(0);
  };

  useEffect(() => {
    if (!isActive) return;

    // Adjust frame rate based on mode
    const frameRate = alphabetScanMode ? 150 : 1000; // 6-7 FPS for alphabet mode, 1 FPS for phrase mode

    const interval = setInterval(() => {
      captureAndProcessFrame();
    }, frameRate);

    return () => clearInterval(interval);
  }, [isActive, isProcessing, alphabetScanMode, lockedLetter, sessionId]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className="overflow-hidden shadow-card">
      <div className="relative aspect-video bg-muted">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <Camera className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Camera inactive</p>
            </div>
          </div>
        )}

        {/* Alphabet mode status overlay */}
        {alphabetScanMode && isActive && (
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-card">
              <p className="text-sm font-medium text-foreground">{status}</p>
              {lockedLetter && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-3xl font-bold text-primary">{lockedLetter}</div>
                  <div className="text-xs text-muted-foreground">
                    ASL fingerspelling letter {lockedLetter}
                  </div>
                </div>
              )}
              {!lockedLetter && recentPredictions.length > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(recentPredictions.length / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analyzing... {recentPredictions.length}/10
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hand guide box */}
        {alphabetScanMode && isActive && !lockedLetter && noHandTimer > 2 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-dashed border-primary/50 rounded-lg w-64 h-64 flex items-center justify-center">
              <p className="text-primary font-medium">Place hand here</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={toggleCamera}
            className="rounded-full shadow-lg"
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {alphabetScanMode && lockedLetter && (
            <Button
              size="lg"
              onClick={handleScanNext}
              className="rounded-full shadow-lg"
            >
              Scan Next Letter
            </Button>
          )}
          {!lockedLetter && (
            <Button
              size="lg"
              onClick={isActive ? stopCamera : startCamera}
              className="rounded-full shadow-lg"
              variant={isActive ? "secondary" : "default"}
            >
              {isActive ? (
                <>
                  <VideoOff className="mr-2 h-5 w-5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  Start Camera
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CameraFeed;
