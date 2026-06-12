'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle, Sparkles, AlertCircle } from 'lucide-react';
import type { TeachingIntent } from '@/types';

interface QuizOverlayProps {
  quiz: TeachingIntent['quiz'];
  languageMode: 'en' | 'bn' | 'both';
  onSubmit: (answer: string) => void;
}

export function QuizOverlay({ quiz, languageMode, onSubmit }: QuizOverlayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!quiz) return null;

  const isCorrect = selectedAnswer === quiz.correctAnswer;

  const qText = languageMode === 'en'
    ? quiz.questionText.en
    : quiz.questionText.bn;

  const getChoiceText = (choice: NonNullable<TeachingIntent['quiz']>['choices'][0]) => {
    if (languageMode === 'en') return choice.text.en;
    return choice.text.bn;
  };

  const handleSelect = (choiceId: string) => {
    if (showResult) return;
    setSelectedAnswer(choiceId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    setTimeout(() => {
      onSubmit(selectedAnswer);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 3500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-md"
        >
          {/* Quiz card */}
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #1a3d2a 0%, #2d6a4f 100%)',
              }}
            >
              <HelpCircle className="h-4 w-4 text-yellow-300 shrink-0" />
              <span
                className="text-sm font-semibold text-yellow-200"
                style={{ fontFamily: "'Caveat', cursive", fontSize: '16px', letterSpacing: '0.03em' }}
              >
                ❓ প্রশ্ন করি!
              </span>
            </div>

            <div className="p-4">
              {/* Question */}
              <p
                className="text-sm sm:text-base font-medium mb-4 leading-relaxed"
                style={{
                  fontFamily: /[\u0980-\u09FF]/.test(qText) ? '"Noto Sans Bengali", sans-serif' : undefined,
                }}
              >
                {qText}
              </p>

              {/* Choices */}
              <div className="space-y-2 mb-4">
                {quiz.choices.map((choice) => {
                  const isSelected = selectedAnswer === choice.id;
                  const isCorrectChoice = choice.id === quiz.correctAnswer;
                  const choiceText = getChoiceText(choice);

                  let bg = 'bg-muted/40 hover:bg-muted border-border/60 hover:border-border';
                  let icon = null;

                  if (showResult) {
                    if (isCorrectChoice) {
                      bg = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 text-emerald-800 dark:text-emerald-200';
                      icon = <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
                    } else if (isSelected && !isCorrect) {
                      bg = 'bg-rose-50 dark:bg-rose-900/30 border-rose-400 text-rose-800 dark:text-rose-200';
                      icon = <XCircle className="h-4 w-4 text-rose-500 shrink-0" />;
                    } else {
                      bg = 'bg-muted/20 border-border/30 opacity-50';
                    }
                  } else if (isSelected) {
                    bg = 'bg-sky-50 dark:bg-sky-900/30 border-sky-400 text-sky-800 dark:text-sky-200';
                  }

                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleSelect(choice.id)}
                      disabled={showResult}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${bg}`}
                    >
                      {/* Choice label */}
                      <span
                        className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: isSelected && !showResult ? '#0ea5e9' : 'rgba(0,0,0,0.08)',
                          color: isSelected && !showResult ? 'white' : undefined,
                        }}
                      >
                        {choice.label}
                      </span>
                      <span
                        className="text-sm flex-1"
                        style={{
                          fontFamily: /[\u0980-\u09FF]/.test(choiceText) ? '"Noto Sans Bengali", sans-serif' : undefined,
                        }}
                      >
                        {choiceText}
                      </span>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Submit / Result */}
              {!showResult ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: selectedAnswer
                      ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
                      : undefined,
                    fontFamily: '"Noto Sans Bengali", sans-serif',
                  }}
                >
                  {selectedAnswer ? 'উত্তর দাও →' : 'একটি উত্তর বেছে নাও'}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
                      : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isCorrect ? (
                      <>
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300"
                          style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
                          শাবাশ! একদম ঠিক! 🎉
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300"
                          style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
                          ভুল হয়েছে — চিন্তা নেই!
                        </span>
                      </>
                    )}
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      color: isCorrect ? '#065f46' : '#92400e',
                      fontFamily: '"Noto Sans Bengali", sans-serif',
                    }}
                  >
                    {languageMode === 'en' ? quiz.explanation.en : quiz.explanation.bn}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
