'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  History,
  Clock,
  Play,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { HistoryEntry } from '@/types';
import { fetchHistory, formatDuration, formatRelativeTime } from '@/services/history';

interface HistoryViewerProps {
  onReplay?: (sessionId: string, classroomId: string) => void;
}

export function HistoryViewer({ onReplay }: HistoryViewerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchHistory().then((data) => {
      setHistory(data);
      setIsLoading(false);
    });
  }, []);

  const displayedHistory = isExpanded ? history : history.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent Sessions</h2>
          {!isLoading && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {history.length}
            </Badge>
          )}
        </div>
        {history.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show All'}
            <ChevronRight
              className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : displayedHistory.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No sessions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a classroom to start learning
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayedHistory.map((entry) => (
            <Card
              key={entry.id}
              className="group border border-border/40 bg-card/60 hover:border-border hover:bg-card transition-all duration-200"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {entry.classroom_name}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 shrink-0"
                      >
                        {entry.subjectIcon} {entry.subjectLabel}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
                      {entry.summary}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(entry.duration)}
                      </span>
                      <span>{formatRelativeTime(entry.started_at)}</span>
                      <span>{entry.events_count} events</span>
                    </div>
                  </div>
                  {onReplay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onReplay(entry.id, entry.classroom_id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
