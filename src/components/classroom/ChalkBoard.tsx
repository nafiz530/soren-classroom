'use client';

import { useEffect, useState } from 'react';
import type { BoardBlock } from '@/types';

interface ChalkBoardProps {
  blocks: BoardBlock[];
  languageMode: 'en' | 'bn' | 'both';
  isWriting?: boolean;
  className?: string;
}

// Chalk color palette
const CHALK_COLORS: Record<string, string> = {
  white:   '#f0ede8',
  yellow:  '#ffd166',
  cyan:    '#8ecae6',
  green:   '#95d5b2',
  pink:    '#ffb3c6',
  default: '#e8e4df',
};

const TYPE_COLORS: Record<string, string> = {
  definition: 'yellow',
  concept:    'white',
  example:    'cyan',
  diagram:    'cyan',
  recap:      'green',
  formula:    'yellow',
  table:      'cyan',
  graph:      'white',
  steps:      'white',
  key_points: 'green',
};

const TYPE_ICONS: Record<string, string> = {
  definition: '📌',
  concept:    '💡',
  example:    '✎',
  diagram:    '📊',
  recap:      '📋',
  formula:    '📐',
  table:      '📋',
  graph:      '📈',
  steps:      '①',
  key_points: '★',
};

function resolveChalkColor(block: BoardBlock): string {
  const key = (block as any).chalkColor || TYPE_COLORS[block.type] || 'white';
  return CHALK_COLORS[key] || CHALK_COLORS.default;
}

function getBlockLines(block: BoardBlock, languageMode: 'en' | 'bn' | 'both'): string[] {
  const chalkLines = (block as any).chalkLines as string[] | undefined;
  if (chalkLines && chalkLines.length > 0) return chalkLines;
  // Fallback: construct from text fields
  const primary = languageMode === 'en'
    ? block.text
    : (block.localizedText?.bn || block.text);
  return [primary];
}

// Typewriter for a single line — fires once per `text` value
function TypewriterLine({
  text,
  startDelay,
  color,
  fontSize = 15,
  isFormula = false,
}: {
  text: string;
  startDelay: number;
  color: string;
  fontSize?: number;
  isFormula?: boolean;
}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    let charIdx = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        charIdx++;
        setDisplayed(text.slice(0, charIdx));
        if (charIdx >= text.length) {
          clearInterval(intervalId!);
          setDone(true);
        }
      }, isFormula ? 18 : 22);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, startDelay, isFormula]);

  // Detect indentation for visual hierarchy
  const leadingSpaces = text.match(/^(\s+)/)?.[1]?.length || 0;
  const paddingLeft = leadingSpaces * 8;

  return (
    <div style={{ paddingLeft: `${paddingLeft}px`, lineHeight: 1.55 }}>
      <span
        style={{
          fontFamily: isFormula
            ? 'monospace'
            : "'Caveat', 'Patrick Hand', cursive, sans-serif",
          fontSize: `${fontSize}px`,
          color,
          textShadow: `0 0 10px ${color}35, 0 1px 0 ${color}18`,
          letterSpacing: '0.025em',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {displayed}
        {!done && (
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '0.9em',
              background: color,
              marginLeft: '1px',
              verticalAlign: 'text-bottom',
              animation: 'chalkBlink 0.65s step-end infinite',
            }}
          />
        )}
      </span>
    </div>
  );
}

// One board section (a single block's content)
function BoardSection({
  block,
  languageMode,
  baseDelay,
}: {
  block: BoardBlock;
  languageMode: 'en' | 'bn' | 'both';
  baseDelay: number;
}) {
  const lines   = getBlockLines(block, languageMode);
  const color   = resolveChalkColor(block);
  const icon    = TYPE_ICONS[block.type] || '';
  const dimColor = CHALK_COLORS.white;

  // Header: icon + localised title
  const headerText = `${icon}  ${block.localizedText?.bn || block.text}`;

  return (
    <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Section header line */}
      <TypewriterLine
        text={headerText}
        startDelay={baseDelay}
        color={color}
        fontSize={16}
      />

      {/* Content lines */}
      {lines.map((line, i) => (
        <TypewriterLine
          key={`${block.id}-line-${i}`}
          text={line}
          startDelay={baseDelay + 280 + i * 220}
          color={i === 0 ? color : dimColor}
          fontSize={14}
        />
      ))}

      {/* Formula block */}
      {block.formulaText && (
        <div style={{
          marginTop: '6px',
          padding: '6px 12px',
          borderRadius: '5px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <TypewriterLine
            text={`   ${block.formulaText}`}
            startDelay={baseDelay + 550}
            color={CHALK_COLORS.yellow}
            fontSize={15}
            isFormula
          />
        </div>
      )}

      {/* Table */}
      {block.tableData && (
        <div style={{ marginTop: '6px', overflowX: 'auto' }}>
          <table style={{ fontSize: '11px', width: '100%', borderCollapse: 'collapse', fontFamily: "'Caveat', cursive" }}>
            <thead>
              <tr>
                {block.tableData.headers.map((h, i) => (
                  <th key={i} style={{
                    padding: '2px 8px',
                    borderBottom: `1px solid ${color}40`,
                    color,
                    textAlign: 'left',
                    fontWeight: 'normal',
                    fontSize: '12px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.tableData.rows.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '2px 8px', color: CHALK_COLORS.white, fontSize: '11px' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mini bar chart */}
      {block.graphData && (
        <div style={{ marginTop: '6px', padding: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
          <div style={{ color: CHALK_COLORS.white, fontSize: '11px', fontFamily: 'cursive', marginBottom: '4px' }}>
            {block.graphData.title || 'Graph'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '32px' }}>
            {block.graphData.datasets[0]?.values.slice(0, 8).map((v, i) => {
              const max = Math.max(...block.graphData!.datasets[0].values, 1);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: '2px 2px 0 0',
                    height: `${Math.max(10, (v / max) * 100)}%`,
                    background: block.graphData!.datasets[0].color || CHALK_COLORS.cyan,
                    minWidth: '4px',
                    opacity: 0.85,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Chalk dust particle
function DustParticle({ index }: { index: number }) {
  const size  = 1 + (index % 3) * 0.8;
  const left  = 8 + index * 14;
  const top   = 15 + (index * 17) % 70;
  const dur   = 2 + index * 0.35;
  const delay = index * 0.45;

  return (
    <div
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'rgba(240,237,232,0.35)',
        left: `${left}%`,
        top: `${top}%`,
        animation: `chalkDust ${dur}s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────
export function ChalkBoard({ blocks, languageMode, isWriting, className }: ChalkBoardProps) {
  // Keep the most recent 4 blocks so the board doesn't overflow
  const visible = blocks.slice(-4);

  return (
    <div
      className={className || ''}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a3d2a 0%, #1e4530 45%, #1a3d2a 100%)',
      }}
    >
      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.04,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Inner frame shadow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        boxShadow: 'inset 0 0 48px rgba(0,0,0,0.55), inset 0 0 2px rgba(100,70,30,0.25)',
      }} />

      {/* Chalk dust particles (only while writing) */}
      {isWriting && Array.from({ length: 7 }, (_, i) => (
        <DustParticle key={i} index={i} />
      ))}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', opacity: 0.22 }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>✏️</div>
            <p style={{
              fontFamily: "'Caveat', cursive",
              color: CHALK_COLORS.white,
              fontSize: '15px',
              letterSpacing: '0.08em',
            }}>বোর্ড এখন খালি</p>
            <p style={{
              fontFamily: "'Caveat', cursive",
              color: CHALK_COLORS.white,
              fontSize: '12px',
              marginTop: '4px',
            }}>একটি বিষয় জিজ্ঞেস করো</p>
          </div>
        </div>
      )}

      {/* Board content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        padding: '14px 18px',
        scrollbarWidth: 'none',
      }}>
        {/* Board header rule */}
        {visible.length > 0 && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.14)', marginBottom: '10px', paddingBottom: '4px' }}>
            <span style={{
              color: 'rgba(255,255,255,0.28)',
              fontSize: '9px',
              letterSpacing: '0.22em',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}>✦ শিক্ষার বোর্ড ✦</span>
          </div>
        )}

        {visible.map((block, i) => (
          <BoardSection
            key={block.id}
            block={block}
            languageMode={languageMode}
            baseDelay={i * 80}
          />
        ))}
      </div>

      {/* Writing indicator */}
      {isWriting && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '10px',
          color: 'rgba(255,255,255,0.32)',
          fontSize: '9px',
          fontFamily: 'cursive',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
        }}>
          ✏ লিখছেন...
        </div>
      )}

      <style>{`
        @keyframes chalkBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes chalkDust {
          0%, 100% { transform: translate(0, 0); opacity: 0.35; }
          33% { transform: translate(3px, -9px); opacity: 0.1; }
          66% { transform: translate(-2px, -5px); opacity: 0.2; }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
