'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
} from 'lucide-react';
import { useTimelineStore } from '@/stores/timelineStore';
import { useState, useCallback } from 'react';

interface PlaybackControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlaybackControls({
  onPlay,
  onPause,
  onSeek,
  onRestart,
  isMuted,
  onToggleMute,
}: PlaybackControlsProps) {
  const playback = useTimelineStore((s) => s.playback);
  const [localTime, setLocalTime] = useState(playback.currentTime);

  const isPlaying = playback.status === 'playing';
  const isCompleted = playback.status === 'completed';
  const progress =
    playback.totalDuration > 0
      ? (playback.currentTime / playback.totalDuration) * 100
      : 0;

  const handleSeek = useCallback(
    (value: number[]) => {
      const time = (value[0] / 100) * playback.totalDuration;
      setLocalTime(time);
      onSeek(time);
    },
    [playback.totalDuration, onSeek]
  );

  return (
    <div className="flex items-center gap-3 w-full px-1">
      {/* Restart */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onRestart}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Restart
        </TooltipContent>
      </Tooltip>

      {/* Rewind 10s */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onSeek(Math.max(0, playback.currentTime - 10))}
          >
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Back 10s
        </TooltipContent>
      </Tooltip>

      {/* Play/Pause */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="h-9 w-9 p-0 rounded-full shadow-md"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isPlaying ? 'Pause' : isCompleted ? 'Replay' : 'Play'}
        </TooltipContent>
      </Tooltip>

      {/* Forward 10s */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              onSeek(Math.min(playback.totalDuration, playback.currentTime + 10))
            }
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Forward 10s
        </TooltipContent>
      </Tooltip>

      {/* Time display */}
      <span className="text-[11px] font-mono text-muted-foreground min-w-[80px] text-center tabular-nums">
        {formatTime(playback.currentTime)} / {formatTime(playback.totalDuration)}
      </span>

      {/* Progress slider */}
      <div className="flex-1 min-w-0">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Mute */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onToggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isMuted ? 'Unmute' : 'Mute'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
