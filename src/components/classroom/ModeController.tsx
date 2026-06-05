'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Gauge,
  Zap,
  Monitor,
  Wind,
  Rocket,
} from 'lucide-react';
import type { PerformanceMode } from '@/types';
import { useModeStore } from '@/stores/modeStore';

const MODES: {
  value: PerformanceMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  color: string;
}[] = [
  { value: 'low', label: 'Low', icon: Gauge, desc: 'Static, minimal animation', color: 'text-slate-500' },
  { value: 'standard', label: 'Standard', icon: Monitor, desc: 'Basic canvas writing', color: 'text-sky-500' },
  { value: 'smooth', label: 'Smooth', icon: Wind, desc: 'Full synced experience', color: 'text-emerald-500' },
  { value: 'ultra', label: 'Ultra', icon: Rocket, desc: 'Enhanced effects (GPU)', color: 'text-amber-500' },
];

export function ModeController() {
  const { currentMode, setMode, deviceProfile, renderSettings } = useModeStore();

  return (
    <div className="flex items-center gap-1">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.value;

        return (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 w-7 p-0 ${isActive ? 'shadow-sm' : ''}`}
                onClick={() => setMode(mode.value)}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? '' : mode.color}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{mode.label} Mode</p>
              <p className="text-muted-foreground">{mode.desc}</p>
              {isActive && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Target: {renderSettings.targetFPS} FPS
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}

      {deviceProfile && (
        <div className="ml-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Zap className="h-3 w-3" />
          {deviceProfile.gpuTier} GPU
        </div>
      )}
    </div>
  );
}
