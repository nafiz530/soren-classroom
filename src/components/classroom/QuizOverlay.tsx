'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
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

  const getQuestionText = () => {
    if (languageMode === 'bn') return quiz.questionText.bn;
    if (languageMode === 'both') return `${quiz.questionText.bn}\n${quiz.questionText.en}`;
    return quiz.questionText.en;
  };

  const getChoiceText = (choice: typeof quiz.choices[0]) => {
    if (languageMode === 'bn') return choice.text.bn;
    if (languageMode === 'both') return `${choice.text.bn} (${choice.text.en})`;
    return choice.text.en;
  };

  const getExplanationText = () => {
    if (languageMode === 'bn') return quiz.explanation.bn;
    if (languageMode === 'both') return `${quiz.explanation.bn}\n${quiz.explanation.en}`;
    return quiz.explanation.en;
  };

  const handleSelect = (choiceId: string) => {
    if (showResult) return;
    setSelectedAnswer(choiceId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    // Auto-advance after showing result
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
        className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg"
        >
          <Card className="shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">কুইজ টাইম! / Quiz Time!</CardTitle>
              </div>
              <p className="text-sm whitespace-pre-wrap mt-2" dir="auto">{getQuestionText()}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {quiz.choices.map((choice) => {
                const isSelected = selectedAnswer === choice.id;
                const isCorrectChoice = choice.id === quiz.correctAnswer;

                let variant: 'outline' | 'default' = 'outline';
                let className = 'justify-start text-left h-auto py-3 px-4';

                if (showResult) {
                  if (isCorrectChoice) {
                    className += ' border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300';
                  } else if (isSelected && !isCorrect) {
                    className += ' border-destructive bg-destructive/10 text-destructive';
                  }
                } else if (isSelected) {
                  variant = 'default';
                }

                return (
                  <Button
                    key={choice.id}
                    variant={variant}
                    className={className}
                    onClick={() => handleSelect(choice.id)}
                    disabled={showResult}
                  >
                    <span className="font-semibold mr-2">{choice.label}.</span>
                    <span className="text-sm" dir="auto">{getChoiceText(choice)}</span>
                    {showResult && isCorrectChoice && (
                      <CheckCircle2 className="h-4 w-4 ml-auto text-emerald-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 ml-auto text-destructive" />
                    )}
                  </Button>
                );
              })}

              {/* Submit or Result */}
              <div className="pt-3">
                {!showResult ? (
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600"
                    onClick={handleSubmit}
                    disabled={!selectedAnswer}
                  >
                    উত্তর জমা দিন / Submit Answer
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg text-sm ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {isCorrect ? 'চমৎকার! সঠিক উত্তর! / Correct!' : 'একটু ভাবো... / Not quite right'}
                      </span>
                    </div>
                    <p className="text-xs" dir="auto">{getExplanationText()}</p>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
