'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Sparkles } from 'lucide-react';
import type { ClassNumber, Stream, SubjectId, PerformanceMode } from '@/types';
import { CLASS_CONFIG, STREAM_OPTIONS, getSubjectsForClass } from '@/config/curriculum';

interface CreateClassroomDialogProps {
  onCreate: (data: {
    classNumber: ClassNumber;
    stream?: Stream;
    subject: SubjectId;
    subjectLabel: string;
    subjectIcon: string;
    name?: string;
    mode_preset?: PerformanceMode;
  }) => void;
}

const CLASS_OPTIONS: { value: ClassNumber; label: string }[] = [
  { value: 6, label: 'Class 6' },
  { value: 7, label: 'Class 7' },
  { value: 8, label: 'Class 8' },
  { value: 9, label: 'Class 9' },
  { value: 10, label: 'Class 10' },
];

export function CreateClassroomDialog({ onCreate }: CreateClassroomDialogProps) {
  const [open, setOpen] = useState(false);
  const [classNumber, setClassNumber] = useState<ClassNumber>(6);
  const [stream, setStream] = useState<Stream | undefined>(undefined);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const hasStreams = CLASS_CONFIG[classNumber].hasStreams;
  const subjects = useMemo(
    () => getSubjectsForClass(classNumber, stream),
    [classNumber, stream]
  );

  // Reset stream when class changes to non-stream class
  const handleClassChange = (value: string) => {
    const newClass = parseInt(value) as ClassNumber;
    setClassNumber(newClass);
    if (!CLASS_CONFIG[newClass].hasStreams) {
      setStream(undefined);
    } else {
      setStream('Science');
    }
    setSelectedSubject('');
  };

  // Reset subject when stream changes
  const handleStreamChange = (value: string) => {
    setStream(value as Stream);
    setSelectedSubject('');
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  const handleCreate = async () => {
    if (!currentSubject) return;
    setIsCreating(true);
    try {
      await onCreate({
        classNumber,
        stream,
        subject: currentSubject.id as SubjectId,
        subjectLabel: currentSubject.label,
        subjectIcon: currentSubject.icon,
        name: customName.trim() || undefined,
        mode_preset: 'auto',
      });
      setCustomName('');
      setSelectedSubject('');
      setStream(undefined);
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 gap-2 font-medium" size="sm">
          <Plus className="h-4 w-4" />
          Create Classroom
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            New Classroom
          </DialogTitle>
          <DialogDescription>
            Set up a new AI-powered classroom. Choose class, stream, and subject to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Class Selection */}
          <div className="grid gap-2">
            <Label htmlFor="class" className="text-xs font-medium">
              Class
            </Label>
            <Select value={String(classNumber)} onValueChange={handleClassChange}>
              <SelectTrigger id="class" className="h-10">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={String(c.value)}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stream Selection (only for class 9-10) */}
          {hasStreams && (
            <div className="grid gap-2">
              <Label htmlFor="stream" className="text-xs font-medium">
                Stream
              </Label>
              <Select value={stream || 'Science'} onValueChange={handleStreamChange}>
                <SelectTrigger id="stream" className="h-10">
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {STREAM_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject Selection */}
          <div className="grid gap-2">
            <Label htmlFor="subject" className="text-xs font-medium">
              Subject
            </Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger id="subject" className="h-10">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.icon}</span>
                      <span>{s.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Name */}
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-medium">
              Custom Name <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Exam Prep — Algebra"
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="h-10">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!currentSubject || isCreating} className="h-10">
            {isCreating ? 'Creating...' : 'Create Classroom'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
