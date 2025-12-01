import { useState, useEffect } from "react";
import { Volume2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TranslationOutputProps {
  detectedText?: string;
  alphabetScanMode?: boolean;
}

const TranslationOutput = ({ detectedText = "", alphabetScanMode = false }: TranslationOutputProps) => {
  const [targetLanguage, setTargetLanguage] = useState("english");
  const [translatedText, setTranslatedText] = useState("");

  useEffect(() => {
    if (detectedText) {
      // TODO: Integrate with translation API
      setTranslatedText(detectedText);
    }
  }, [detectedText]);

  const speak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map language codes
      const langMap: { [key: string]: string } = {
        'english': 'en-US',
        'hindi': 'hi-IN',
        'marathi': 'mr-IN'
      };
      
      utterance.lang = langMap[lang] || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      speechSynthesis.speak(utterance);
      toast.success("Playing audio");
    } else {
      toast.error("Text-to-speech not supported in this browser");
    }
  };

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "हिंदी (Hindi)" },
    { value: "marathi", label: "मराठी (Marathi)" },
  ];

  // Alphabet scan mode - show letter card
  if (alphabetScanMode && detectedText) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-8xl font-bold text-primary mb-4">
              {detectedText}
            </div>
            <p className="text-lg font-medium text-foreground">
              Detected sign: {detectedText} (ASL fingerspelling)
            </p>
            
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Listen in different languages:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {languages.map((lang) => (
                  <Button
                    key={lang.value}
                    variant="outline"
                    size="sm"
                    onClick={() => speak(`Letter ${detectedText}`, lang.value)}
                    className="gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal phrase mode
  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5 text-primary" />
            Detected Sign Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <p className="flex-1 text-lg font-medium text-foreground">{detectedText}</p>
            <Button
              size="icon"
              variant="outline"
              onClick={() => speak(detectedText, "english")}
              className="shrink-0"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5 text-accent" />
            Translation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <p className="flex-1 text-lg font-medium text-foreground">{translatedText}</p>
            <Button
              size="icon"
              variant="outline"
              onClick={() => speak(translatedText, targetLanguage)}
              className="shrink-0"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationOutput;
