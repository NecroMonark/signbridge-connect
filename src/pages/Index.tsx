import Navbar from "@/components/Navbar";
import CameraFeed from "@/components/CameraFeed";
import TranslationOutput from "@/components/TranslationOutput";
import AILearningChat from "@/components/AILearningChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-6 px-4 space-y-6 max-w-4xl mx-auto">
        {/* Camera Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Live Camera Feed</h2>
          <CameraFeed />
        </section>

        {/* Translation Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Translation</h2>
          <TranslationOutput />
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
