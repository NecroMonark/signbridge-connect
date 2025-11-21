import { useState } from "react";
import { Volume2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TranslationOutput = () => {
  const [detectedText, setDetectedText] = useState("Hello, how are you?");
  const [targetLanguage, setTargetLanguage] = useState("english");
  const [translatedText, setTranslatedText] = useState("Hello, how are you?");

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
