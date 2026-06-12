'use client';

import { useEffect, useState, useRef } from 'react';
import type { BoardBlock } from '@/types';

// ── Chalk colours ─────────────────────────────────────────────────
const CHALK: Record<string, string> = {
  white:   '#f0ede8',
  yellow:  '#ffd166',
  cyan:    '#8ecae6',
  green:   '#95d5b2',
  pink:    '#ffb3c6',
  default: '#e4e0db',
};
const TYPE_COLOR: Record<string, string> = {
  definition: 'yellow', concept: 'white', example: 'cyan',
  diagram: 'cyan', recap: 'green', formula: 'yellow',
  table: 'cyan', graph: 'white', steps: 'white', key_points: 'green',
};
const TYPE_ICON: Record<string, string> = {
  definition: '📌', concept: '💡', example: '✎', diagram: '📊',
  recap: '📋', formula: '📐', table: '📋', graph: '📈',
  steps: '①', key_points: '★',
};

function chalkColor(block: BoardBlock): string {
  const k = (block as any).chalkColor || TYPE_COLOR[block.type] || 'white';
  return CHALK[k] || CHALK.default;
}
function blockLines(block: BoardBlock, lang: string): string[] {
  const cl = (block as any).chalkLines as string[] | undefined;
  if (cl?.length) return cl;
  return [lang === 'en' ? block.text : (block.localizedText?.bn || block.text)];
}

// ── Typewriter line ───────────────────────────────────────────────
function TwLine({ text, delay, color, size = 14, formula = false }: {
  text: string; delay: number; color: string;
  size?: number; formula?: boolean;
}) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown(''); setDone(false);
    let i = 0;
    let iv: ReturnType<typeof setInterval>;
    const to = setTimeout(() => {
      iv = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, formula ? 16 : 20);
    }, delay);
    return () => { clearTimeout(to); clearInterval(iv); };
  }, [text, delay, formula]);

  const indent = (text.match(/^(\s+)/)?.[1]?.length || 0) * 7;
  return (
    <div style={{ paddingLeft: `${indent}px`, lineHeight: 1.55, minHeight: `${size + 4}px` }}>
      <span style={{
        fontFamily: formula ? 'monospace' : "'Caveat','Patrick Hand',cursive",
        fontSize: `${size}px`, color,
        textShadow: `0 0 9px ${color}30`,
        letterSpacing: '0.02em', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {shown}
        {!done && (
          <span style={{
            display: 'inline-block', width: '2px', height: '0.85em',
            background: color, marginLeft: '1px', verticalAlign: 'text-bottom',
            animation: 'ckBlink .65s step-end infinite',
          }} />
        )}
      </span>
    </div>
  );
}

// ── One board section ─────────────────────────────────────────────
function BoardSection({ block, lang, delay, faded }: {
  block: BoardBlock; lang: string; delay: number; faded: boolean;
}) {
  const color = chalkColor(block);
  const lines = blockLines(block, lang);
  const icon  = TYPE_ICON[block.type] || '';
  const header = `${icon}  ${block.localizedText?.bn || block.text}`;
  const dimmed = faded ? 0.38 : 1;

  return (
    <div style={{
      marginBottom: '13px', paddingBottom: '10px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      opacity: dimmed, transition: 'opacity 0.5s',
    }}>
      <TwLine text={header} delay={faded ? 0 : delay} color={color} size={15} />
      {lines.map((l, i) => (
        <TwLine
          key={i} text={l}
          delay={faded ? 0 : delay + 260 + i * 210}
          color={i === 0 ? color : CHALK.white} size={13}
        />
      ))}
      {block.formulaText && (
        <div style={{
          margin: '5px 0 2px', padding: '5px 10px',
          borderRadius: '4px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <TwLine text={`  ${block.formulaText}`}
            delay={faded ? 0 : delay + 500}
            color={CHALK.yellow} size={14} formula />
        </div>
      )}
    </div>
  );
}

// ── Notebook panel ────────────────────────────────────────────────
function Notebook({ blocks, lang, onClose }: {
  blocks: BoardBlock[]; lang: string; onClose: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'linear-gradient(160deg,#0d1f15 0%,#091510 100%)',
      borderRadius: '8px', display: 'flex', flexDirection: 'column',
      animation: 'nbSlide .25s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Caveat',cursive", fontSize: '16px',
          color: CHALK.yellow, textShadow: `0 0 8px ${CHALK.yellow}40`,
        }}>📓 নোটবুক — সব লেখা</span>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
          color: CHALK.white, fontSize: '11px', padding: '3px 9px',
          cursor: 'pointer', fontFamily: '"Noto Sans Bengali",sans-serif',
        }}>বন্ধ করো ✕</button>
      </div>

      {/* Blocks list — all history */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px', scrollbarWidth: 'none',
      }}>
        {blocks.length === 0 && (
          <p style={{
            color: 'rgba(255,255,255,0.25)', fontFamily: "'Caveat',cursive",
            fontSize: '14px', textAlign: 'center', marginTop: '40px',
          }}>এখনো কিছু লেখা হয়নি</p>
        )}
        {blocks.map((b, i) => (
          <div key={b.id} style={{
            marginBottom: '14px', paddingBottom: '10px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Section number */}
            <span style={{
              fontFamily: 'monospace', fontSize: '9px',
              color: 'rgba(255,255,255,0.2)', marginBottom: '3px', display: 'block',
            }}>#{i + 1}</span>
            <div style={{ color: chalkColor(b) }}>
              <span style={{
                fontFamily: "'Caveat',cursive", fontSize: '14px',
                textShadow: `0 0 7px ${chalkColor(b)}30`,
              }}>
                {TYPE_ICON[b.type] || ''} {b.localizedText?.bn || b.text}
              </span>
            </div>
            {blockLines(b, lang).map((l, j) => (
              <div key={j} style={{
                fontFamily: "'Caveat',cursive", fontSize: '12px',
                color: j === 0 ? chalkColor(b) : CHALK.white,
                paddingLeft: '10px', lineHeight: 1.5,
                opacity: j === 0 ? 0.9 : 0.7,
              }}>{l}</div>
            ))}
            {b.formulaText && (
              <div style={{
                fontFamily: 'monospace', fontSize: '12px',
                color: CHALK.yellow, paddingLeft: '14px', marginTop: '3px',
              }}>{b.formulaText}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dust particle ─────────────────────────────────────────────────
function DustDot({ i }: { i: number }) {
  return (
    <div style={{
      position: 'absolute', pointerEvents: 'none',
      width: `${1 + (i % 3) * 0.7}px`, height: `${1 + (i % 3) * 0.7}px`,
      borderRadius: '50%', background: 'rgba(240,237,232,0.3)',
      left: `${8 + i * 13}%`, top: `${15 + (i * 19) % 68}%`,
      animation: `ckDust ${2 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
    }} />
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
interface ChalkBoardProps {
  blocks: BoardBlock[];
  allBlocks: BoardBlock[];          // full history for notebook
  languageMode: 'en' | 'bn' | 'both';
  isWriting?: boolean;
  className?: string;
}

export function ChalkBoard({ blocks, allBlocks, languageMode, isWriting, className }: ChalkBoardProps) {
  const [notebookOpen, setNotebookOpen] = useState(false);
  const lang = languageMode === 'en' ? 'en' : 'bn';

  // Show last 8 on the active board; older ones are faded at top
  const VISIBLE = 8;
  const recent = blocks.slice(-VISIBLE);
  const fadedCount = Math.max(0, recent.length - 4); // fade oldest half

  return (
    <div className={className || ''} style={{
      position: 'relative', width: '100%', height: '100%',
      borderRadius: '8px', overflow: 'hidden',
      background: 'linear-gradient(135deg,#1a3d2a 0%,#1e4530 45%,#1a3d2a 100%)',
    }}>
      {/* Grid texture */}
      <div style={{
        position:'absolute',inset:0,pointerEvents:'none',opacity:.04,
        backgroundImage:'linear-gradient(rgba(255,255,255,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.25) 1px,transparent 1px)',
        backgroundSize:'28px 28px',
      }}/>
      {/* Inner shadow */}
      <div style={{
        position:'absolute',inset:0,pointerEvents:'none',
        boxShadow:'inset 0 0 48px rgba(0,0,0,.55),inset 0 0 2px rgba(100,70,30,.2)',
      }}/>

      {/* Dust particles */}
      {isWriting && Array.from({length:7},(_,i)=><DustDot key={i} i={i}/>)}

      {/* Notebook button */}
      <button
        onClick={() => setNotebookOpen(true)}
        title="নোটবুক"
        style={{
          position:'absolute', top:'10px', right:'10px', zIndex:9,
          background:'rgba(255,255,255,0.08)', backdropFilter:'blur(6px)',
          border:'1px solid rgba(255,255,255,0.15)', borderRadius:'7px',
          padding:'4px 9px', cursor:'pointer',
          display:'flex', alignItems:'center', gap:'4px',
          color:'rgba(255,255,255,0.6)', fontSize:'11px',
          transition:'all 0.2s',
        }}
      >
        <span>📓</span>
        <span style={{ fontFamily:'"Noto Sans Bengali",sans-serif', fontSize:'10px' }}>
          নোটবুক {allBlocks.length > 0 ? `(${allBlocks.length})` : ''}
        </span>
      </button>

      {/* Empty state */}
      {blocks.length === 0 && !notebookOpen && (
        <div style={{
          position:'absolute',inset:0,display:'flex',
          alignItems:'center',justifyContent:'center',
        }}>
          <div style={{textAlign:'center',opacity:.2}}>
            <div style={{fontSize:'2.6rem',marginBottom:'8px'}}>✏️</div>
            <p style={{fontFamily:"'Caveat',cursive",color:CHALK.white,fontSize:'15px',letterSpacing:'.08em'}}>
              বোর্ড এখন খালি
            </p>
            <p style={{fontFamily:"'Caveat',cursive",color:CHALK.white,fontSize:'12px',marginTop:'4px'}}>
              একটি বিষয় জিজ্ঞেস করো
            </p>
          </div>
        </div>
      )}

      {/* Active board content */}
      {!notebookOpen && (
        <div style={{
          position:'absolute', inset:0, overflowY:'auto',
          padding:'12px 16px 16px', scrollbarWidth:'none',
        }}>
          {recent.length > 0 && (
            <div style={{
              borderBottom:'1px solid rgba(255,255,255,.13)',
              marginBottom:'9px', paddingBottom:'4px',
            }}>
              <span style={{
                color:'rgba(255,255,255,.25)', fontSize:'9px',
                letterSpacing:'.2em', fontFamily:'monospace', textTransform:'uppercase',
              }}>✦ শিক্ষার বোর্ড ✦</span>
            </div>
          )}

          {recent.map((block, i) => (
            <BoardSection
              key={block.id}
              block={block}
              lang={lang}
              delay={i * 60}
              faded={i < fadedCount}
            />
          ))}
        </div>
      )}

      {/* Notebook overlay */}
      {notebookOpen && (
        <Notebook blocks={allBlocks} lang={lang} onClose={() => setNotebookOpen(false)} />
      )}

      {/* Writing indicator */}
      {isWriting && !notebookOpen && (
        <div style={{
          position:'absolute', bottom:'8px', right:'10px',
          color:'rgba(255,255,255,.3)', fontSize:'9px',
          fontFamily:'cursive', letterSpacing:'.08em', pointerEvents:'none',
        }}>✏ লিখছেন...</div>
      )}

      <style>{`
        @keyframes ckBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ckDust {
          0%,100%{transform:translate(0,0);opacity:.3}
          33%{transform:translate(3px,-9px);opacity:.08}
          66%{transform:translate(-2px,-5px);opacity:.18}
        }
        @keyframes nbSlide {
          from{opacity:0;transform:translateY(6px)}
          to{opacity:1;transform:translateY(0)}
        }
        ::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}
