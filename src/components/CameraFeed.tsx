import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface CameraFeedProps {
  onGestureDetected?: (text: string) => void;
}

const CameraFeed = ({ onGestureDetected }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isActive, setIsActive] = useState(false);

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
