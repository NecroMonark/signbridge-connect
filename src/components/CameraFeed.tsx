import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface CameraFeedProps {
  onGestureDetected?: (text: string) => void;
}

const CameraFeed = ({ onGestureDetected }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        body: { frame: frameData }
      });

      if (error) throw error;

      if (data?.detectedSign && onGestureDetected) {
        onGestureDetected(data.detectedSign);
        console.log('Detected sign:', data.detectedSign, 'Confidence:', data.confidence);
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      captureAndProcessFrame();
    }, 1000); // Process frame every second

    return () => clearInterval(interval);
  }, [isActive, isProcessing]);

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

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button
            size="lg"
            onClick={isActive ? stopCamera : startCamera}
            className="rounded-full shadow-lg"
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
        </div>
      </div>
    </Card>
  );
};

export default CameraFeed;
