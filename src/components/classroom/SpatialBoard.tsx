'use client';

import { useMemo } from 'react';
import type { BoardBlock, BoardZone } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SpatialBoardProps {
  blocks: BoardBlock[];
  languageMode: 'en' | 'bn' | 'both';
  className?: string;
}

interface ZoneConfig {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ZONE_CONFIG: Record<BoardZone, ZoneConfig> = {
  'top-left': { x: 2, y: 2, w: 45, h: 30 },
  'center-left': { x: 2, y: 35, w: 45, h: 30 },
  'center': { x: 25, y: 35, w: 50, h: 30 },
  'right': { x: 55, y: 2, w: 43, h: 60 },
  'bottom': { x: 2, y: 70, w: 96, h: 28 },
  'center-large': { x: 10, y: 10, w: 80, h: 80 },
};

const TYPE_COLORS: Record<string, string> = {
  definition: 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
  concept: 'border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  example: 'border-l-4 border-l-sky-500 bg-sky-50 dark:bg-sky-950/30',
  diagram: 'border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950/30',
  recap: 'border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-950/30',
  formula: 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/30',
  table: 'border-l-4 border-l-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
  graph: 'border-l-4 border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
};

const TYPE_LABELS: Record<string, string> = {
  definition: '📝 Def',
  concept: '💡 Concept',
  example: '📌 Example',
  diagram: '📊 Diagram',
  recap: '🔄 Recap',
  formula: '📐 Formula',
  table: '📋 Table',
  graph: '📈 Graph',
};

function getDisplayText(block: BoardBlock, languageMode: 'en' | 'bn' | 'both'): string {
  if (languageMode === 'bn' && block.localizedText?.bn) {
    return block.localizedText.bn;
  }
  if (languageMode === 'both' && block.localizedText?.bn) {
    return `${block.text}\n${block.localizedText.bn}`;
  }
  return block.text;
}

export function SpatialBoard({ blocks, languageMode, className }: SpatialBoardProps) {
  // Group blocks by zone
  const blocksByZone = useMemo(() => {
    const map = new Map<BoardZone, BoardBlock[]>();
    for (const zone of Object.keys(ZONE_CONFIG) as BoardZone[]) {
      map.set(zone, []);
    }
    for (const block of blocks) {
      const zoneBlocks = map.get(block.zone) || [];
      zoneBlocks.push(block);
      map.set(block.zone, zoneBlocks);
    }
    return map;
  }, [blocks]);

  const hasContent = blocks.length > 0;

  return (
    <div className={`relative w-full h-full bg-white dark:bg-gray-900 rounded-xl border border-border shadow-inner overflow-hidden ${className || ''}`}>
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {!hasContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2 opacity-30">📋</div>
            <p className="text-sm">Board will appear here</p>
            <p className="text-xs mt-1">Content is placed in smart zones</p>
          </div>
        </div>
      )}

      {/* Zone containers */}
      {(Object.entries(ZONE_CONFIG) as [BoardZone, ZoneConfig][]).map(([zone, config]) => {
        const zoneBlocks = blocksByZone.get(zone) || [];
        if (zoneBlocks.length === 0 && zone !== 'center-large') return null;

        return (
          <div
            key={zone}
            className="absolute"
            style={{
              left: `${config.x}%`,
              top: `${config.y}%`,
              width: `${config.w}%`,
              height: `${config.h}%`,
            }}
          >
            <AnimatePresence mode="popLayout">
              {zoneBlocks.map((block, idx) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`mb-1.5 p-2 sm:p-2.5 rounded-lg shadow-sm ${TYPE_COLORS[block.type] || ''} ${block.color ? 'ring-2' : ''}`}
                  style={block.color ? { '--tw-ring-color': block.color } as React.CSSProperties : undefined}
                >
                  {/* Type label */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {TYPE_LABELS[block.type] || block.type}
                    </span>
                    {block.importance === 'critical' && (
                      <span className="text-[8px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1 rounded">
                        ★
                      </span>
                    )}
                  </div>

                  {/* Text content */}
                  <p
                    className="text-xs sm:text-sm font-medium leading-snug whitespace-pre-wrap"
                    style={{ fontSize: block.fontSize ? `${block.fontSize}px` : undefined }}
                  >
                    {getDisplayText(block, languageMode)}
                  </p>

                  {/* Formula */}
                  {block.formulaText && (
                    <div className="mt-1 text-xs font-mono bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded text-center">
                      {block.formulaText}
                    </div>
                  )}

                  {/* Table */}
                  {block.tableData && (
                    <div className="mt-1 overflow-x-auto">
                      <table className="text-[10px] w-full">
                        <thead>
                          <tr>
                            {block.tableData.headers.map((h, i) => (
                              <th key={i} className="px-1 py-0.5 border-b font-semibold text-left">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.tableData.rows.slice(0, 4).map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className="px-1 py-0.5 text-left">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Graph placeholder */}
                  {block.graphData && (
                    <div className="mt-1 bg-white/50 dark:bg-black/20 rounded p-1.5">
                      <p className="text-[10px] font-medium mb-0.5">{block.graphData.title || 'Graph'}</p>
                      <div className="flex items-end gap-px h-8">
                        {block.graphData.datasets[0]?.values.slice(0, 8).map((v, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{
                              height: `${Math.max(10, (v / Math.max(...block.graphData!.datasets[0].values)) * 100)}%`,
                              backgroundColor: block.graphData!.datasets[0].color || '#10b981',
                              minWidth: '4px',
                            }}
                          />
                        ))}
                      </div>
                      {block.graphData.labels.length > 0 && (
                        <div className="flex gap-px mt-0.5">
                          {block.graphData.labels.slice(0, 8).map((l, i) => (
                            <div key={i} className="flex-1 text-[7px] text-center truncate">{l}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
