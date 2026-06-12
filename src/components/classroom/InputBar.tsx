'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Loader2, BookOpen } from 'lucide-react';

interface InputBarProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

// Quick question suggestions for Bangladeshi students
const QUICK_SUGGESTIONS = [
  'আরো বিস্তারিত বলো',
  'উদাহরণ দাও',
  'সহজে বোঝাও',
  'পরীক্ষায় কী আসে?',
];

export function InputBar({ onSubmit, isLoading, placeholder }: InputBarProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text: string) => {
    onSubmit(text);
    setShowSuggestions(false);
  };

  const toggleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        setValue((prev) => prev + transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  return (
    <div className="input-bar-wrapper shrink-0 border-t border-border bg-card/90 backdrop-blur-sm">
      {/* Quick suggestions */}
      {showSuggestions && !isLoading && (
        <div className="px-3 pt-2 flex gap-1.5 flex-wrap">
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="text-[10px] sm:text-xs px-2 py-1 rounded-full border border-border/60 bg-muted/50 hover:bg-muted hover:border-border transition-colors text-foreground/70 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5">
        {/* Suggestions toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="shrink-0 h-9 w-9"
          title="দ্রুত প্রশ্ন"
          disabled={isLoading}
        >
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'কী জানতে চাও স্যারকে?'}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 placeholder:text-muted-foreground"
            style={{
              fontFamily: value && /[\u0980-\u09FF]/.test(value)
                ? '"Noto Sans Bengali", sans-serif'
                : undefined,
            }}
          />
        </div>

        {/* Voice */}
        <Button
          size="icon"
          variant={isListening ? 'default' : 'ghost'}
          onClick={toggleVoice}
          className={`shrink-0 h-9 w-9 ${isListening ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''}`}
          disabled={isLoading}
          title={isListening ? 'বন্ধ করো' : 'কণ্ঠে বলো'}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        {/* Send */}
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="shrink-0 h-9 w-9 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm disabled:opacity-40"
          title="পাঠাও"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
