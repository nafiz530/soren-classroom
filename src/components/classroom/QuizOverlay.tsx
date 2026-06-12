'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TeachingIntent } from '@/types';

interface QuizOverlayProps {
  quiz: NonNullable<TeachingIntent['quiz']>;
  languageMode: 'en' | 'bn' | 'both';
  onSubmit: (answer: string) => void;
}

const QUIZ_SECONDS = 45;

const CHOICE_COLORS = {
  idle:    { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', text: '#f0ede8' },
  selected:{ bg: 'rgba(14,165,233,0.2)',  border: '#38bdf8',                text: '#e0f2fe' },
  correct: { bg: 'rgba(16,185,129,0.2)',  border: '#34d399',                text: '#d1fae5' },
  wrong:   { bg: 'rgba(239,68,68,0.18)',  border: '#f87171',                text: '#fee2e2' },
  faded:   { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', text: 'rgba(240,237,232,0.35)' },
};

export function QuizOverlay({ quiz, languageMode, onSubmit }: QuizOverlayProps) {
  const [selected, setSelected]     = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState(false);
  const [timeLeft, setTimeLeft]     = useState(QUIZ_SECONDS);
  const [dismissed, setDismissed]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const handleSubmit = useCallback((forceAnswer?: string) => {
    if (submitted) return;
    const answer = forceAnswer ?? selected;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRef.current)  clearTimeout(autoRef.current);

    // Dismiss and call parent after showing result for 2.8s
    autoRef.current = setTimeout(() => {
      setDismissed(true);
      setTimeout(() => onSubmit(answer ?? ''), 300);
    }, 2800);
  }, [submitted, selected, onSubmit]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(selected ?? ''); // auto-submit on timeout
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoRef.current)  clearTimeout(autoRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed) return null;

  const isCorrect   = submitted && selected === quiz.correctAnswer;
  const isWrong     = submitted && selected !== quiz.correctAnswer && selected !== null;
  const unanswered  = submitted && selected === null;
  const timerPct    = (timeLeft / QUIZ_SECONDS) * 100;

  const qText = languageMode === 'en' ? quiz.questionText.en : quiz.questionText.bn;
  const explText = languageMode === 'en' ? quiz.explanation.en : quiz.explanation.bn;
  const isBn = (t: string) => /[\u0980-\u09FF]/.test(t);

  const resultMsg = isCorrect
    ? '🎉 শাবাশ! একদম ঠিক!'
    : unanswered
    ? '⏰ সময় শেষ! এইটাই সঠিক উত্তর:'
    : `✗ ভুল হয়েছে — সঠিক উত্তর হলো "${quiz.choices.find(c => c.id === quiz.correctAnswer)?.text.bn}"`;

  return (
    <>
      {/* Backdrop — blurs board but doesn't block it fully */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 40,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
      }} />

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 41,
        background: 'linear-gradient(180deg, #0f1f14 0%, #0a1a10 100%)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px 16px 0 0',
        padding: '0 0 env(safe-area-inset-bottom, 0)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Timer bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${timerPct}%`,
            background: timeLeft > 15 ? '#34d399' : timeLeft > 8 ? '#fbbf24' : '#f87171',
            transition: 'width 1s linear, background 0.5s',
          }} />
        </div>

        <div style={{ padding: '16px 16px 20px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>❓</span>
              <span style={{
                fontFamily: "'Caveat', cursive",
                fontSize: '17px',
                color: '#ffd166',
                textShadow: '0 0 8px #ffd16650',
              }}>প্রশ্ন করি!</span>
            </div>
            {!submitted && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: timeLeft > 8 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.2)',
                border: `1px solid ${timeLeft > 8 ? '#34d39940' : '#f8717140'}`,
                borderRadius: '20px', padding: '2px 10px',
              }}>
                <span style={{ fontSize: '12px' }}>⏱</span>
                <span style={{
                  fontSize: '14px', fontWeight: '700',
                  color: timeLeft > 15 ? '#34d399' : timeLeft > 8 ? '#fbbf24' : '#f87171',
                  fontFamily: 'monospace',
                  minWidth: '22px', textAlign: 'center',
                }}>{timeLeft}s</span>
              </div>
            )}
          </div>

          {/* Question */}
          <p style={{
            fontFamily: isBn(qText) ? '"Noto Sans Bengali", sans-serif' : 'inherit',
            fontSize: '14px',
            color: '#f0ede8',
            lineHeight: 1.55,
            marginBottom: '14px',
          }}>{qText}</p>

          {/* Choices grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {quiz.choices.map((choice) => {
              let style = CHOICE_COLORS.idle;
              if (submitted) {
                if (choice.id === quiz.correctAnswer) style = CHOICE_COLORS.correct;
                else if (choice.id === selected)      style = CHOICE_COLORS.wrong;
                else                                  style = CHOICE_COLORS.faded;
              } else if (choice.id === selected) {
                style = CHOICE_COLORS.selected;
              }

              const cText = languageMode === 'en' ? choice.text.en : choice.text.bn;

              return (
                <button
                  key={choice.id}
                  onClick={() => !submitted && setSelected(choice.id)}
                  disabled={submitted}
                  style={{
                    background: style.bg,
                    border: `1.5px solid ${style.border}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    cursor: submitted ? 'default' : 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                  }}
                >
                  {/* Letter badge */}
                  <span style={{
                    minWidth: '20px', height: '20px',
                    borderRadius: '50%',
                    background: choice.id === selected && !submitted
                      ? '#0ea5e9'
                      : submitted && choice.id === quiz.correctAnswer
                      ? '#10b981'
                      : submitted && choice.id === selected
                      ? '#ef4444'
                      : 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: '700',
                    color: (choice.id === selected || (submitted && choice.id === quiz.correctAnswer))
                      ? '#fff' : 'rgba(255,255,255,0.5)',
                    flexShrink: 0, marginTop: '1px',
                    transition: 'background 0.2s',
                  }}>
                    {choice.label}
                  </span>
                  <span style={{
                    fontFamily: isBn(cText) ? '"Noto Sans Bengali", sans-serif' : 'inherit',
                    fontSize: '12px',
                    color: style.text,
                    lineHeight: 1.45,
                  }}>{cText}</span>
                </button>
              );
            })}
          </div>

          {/* Submit button OR result */}
          {!submitted ? (
            <button
              onClick={() => handleSubmit()}
              disabled={!selected}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: selected
                  ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
                  : 'rgba(255,255,255,0.06)',
                color: selected ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: '"Noto Sans Bengali", sans-serif',
                cursor: selected ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: selected ? '0 4px 14px rgba(5,150,105,0.35)' : 'none',
              }}
            >
              {selected ? 'উত্তর দাও →' : 'একটি উত্তর বেছে নাও'}
            </button>
          ) : (
            <div style={{
              borderRadius: '10px',
              padding: '12px 14px',
              background: isCorrect
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(245,158,11,0.12)',
              border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.3)'}`,
            }}>
              <p style={{
                fontFamily: '"Noto Sans Bengali", sans-serif',
                fontSize: '13px',
                fontWeight: '600',
                color: isCorrect ? '#6ee7b7' : '#fcd34d',
                marginBottom: '5px',
              }}>{resultMsg}</p>
              <p style={{
                fontFamily: isBn(explText) ? '"Noto Sans Bengali", sans-serif' : 'inherit',
                fontSize: '12px',
                color: 'rgba(240,237,232,0.75)',
                lineHeight: 1.55,
              }}>{explText}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
