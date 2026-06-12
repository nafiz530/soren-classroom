'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface InputBarProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function InputBar({ onSubmit, isLoading, placeholder }: InputBarProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Voice input using Web Speech API
  const toggleVoice = () => {
    if (typeof window === 'undefined' || !window.SpeechRecognition && !window.webkitSpeechRecognition) {
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        setValue((prev) => prev + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  // Toggle voice language
  const toggleVoiceLang = () => {
    setVoiceLang((prev) => prev === 'bn-BD' ? 'en-US' : 'bn-BD');
  };

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  return (
    <div className="flex items-center gap-2 p-3 border-t border-border bg-card/80 backdrop-blur-sm">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'বিষয় বা প্রশ্ন লিখুন... / Ask a question...'}
          disabled={isLoading}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 placeholder:text-muted-foreground"
          dir="auto"
          lang="bn"
        />
      </div>

      {/* Voice language toggle */}
      <Button
        size="icon"
        variant="ghost"
        onClick={toggleVoiceLang}
        className="shrink-0 h-9 w-9 text-[10px] font-bold"
        disabled={isLoading || isListening}
        title={voiceLang === 'bn-BD' ? 'Voice: Bangla' : 'Voice: English'}
      >
        {voiceLang === 'bn-BD' ? 'বা' : 'EN'}
      </Button>

      {/* Voice input button */}
      <Button
        size="icon"
        variant={isListening ? 'default' : 'ghost'}
        onClick={toggleVoice}
        className={`shrink-0 h-9 w-9 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
        disabled={isLoading}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* Submit button */}
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className="shrink-0 h-9 w-9 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
