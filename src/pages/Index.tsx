import { useState } from "react";
import Navbar from "@/components/Navbar";
import CameraFeed from "@/components/CameraFeed";
import TranslationOutput from "@/components/TranslationOutput";
import AILearningChat from "@/components/AILearningChat";

const Index = () => {
  const [detectedText, setDetectedText] = useState("");

  const handleGestureDetected = (text: string) => {
    setDetectedText(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-6 px-4 space-y-6 max-w-4xl mx-auto">
        {/* Camera Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Live Camera Feed</h2>
          <CameraFeed onGestureDetected={handleGestureDetected} />
        </section>

        {/* Translation Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Translation</h2>
          <TranslationOutput detectedText={detectedText} />
        </section>

        {/* AI Learning Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Learn Sign Language</h2>
          <AILearningChat />
        </section>
      </main>
    </div>
  );
};

export default Index;
