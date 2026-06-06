'use client';

import { useTokenStore } from '@/stores/tokenStore';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export function TokenDisplay() {
  const { showTokens, currentLesson, sessionSummary } = useTokenStore();

  if (!showTokens) return null;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Tokens
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[9px] text-muted-foreground">Input</p>
            <p className="text-xs font-mono font-bold">
              {currentLesson?.input_tokens || 0}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground">Output</p>
            <p className="text-xs font-mono font-bold">
              {currentLesson?.output_tokens || 0}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground">Total</p>
            <p className="text-xs font-mono font-bold text-amber-600">
              {currentLesson?.total_tokens || 0}
            </p>
          </div>
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-border/50">
          <p className="text-[9px] text-muted-foreground">
            Session: {sessionSummary.cumulative_total.toLocaleString()} total
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
