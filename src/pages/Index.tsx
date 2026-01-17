import { useState } from "react";
import Navbar from "@/components/Navbar";
import CameraFeed from "@/components/CameraFeed";
import TranslationOutput from "@/components/TranslationOutput";
import AILearningChat from "@/components/AILearningChat";
import { useSession } from "@/hooks/useSession";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock } from "lucide-react";

const Index = () => {
  const [detectedText, setDetectedText] = useState("");
  const [alphabetScanMode, setAlphabetScanMode] = useState(false);
  const { sessionId, stats, isLoading: sessionLoading } = useSession();

  const handleGestureDetected = (text: string) => {
    setDetectedText(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-6 px-4 space-y-6 max-w-4xl mx-auto">
        {/* Session Stats Bar */}
        {!sessionLoading && stats && (
          <section className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              {stats.total_gestures} gestures
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {stats.session_duration_minutes} min
            </Badge>
            {stats.recent_letters.length > 0 && (
              <div className="flex-1 text-sm text-muted-foreground truncate">
                Recent: {stats.recent_letters.slice(0, 10).join(', ')}
              </div>
            )}
          </section>
        )}

        {/* Alphabet Scan Mode Toggle */}
        <section className="flex items-center justify-between p-4 bg-card rounded-lg shadow-card border border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Alphabet Scan Mode</h3>
            <p className="text-sm text-muted-foreground">Detect ASL alphabet letters one at a time</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alphabetScanMode}
              onChange={(e) => setAlphabetScanMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </section>

        {/* Camera Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Live Camera Feed</h2>
          <CameraFeed 
            onGestureDetected={handleGestureDetected} 
            alphabetScanMode={alphabetScanMode}
            sessionId={sessionId}
          />
        </section>

        {/* Translation Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {alphabetScanMode ? "Detected Letter" : "Translation"}
          </h2>
          <TranslationOutput 
            detectedText={detectedText} 
            alphabetScanMode={alphabetScanMode}
            sessionId={sessionId}
          />
        </section>

        {/* AI Learning Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Learn Sign Language</h2>
          <p className="text-sm text-muted-foreground mb-4">
            For phrases, the system may show multiple letter signs or phrase-level animations.
          </p>
          <AILearningChat />
        </section>
      </main>
    </div>
  );
};

export default Index;
