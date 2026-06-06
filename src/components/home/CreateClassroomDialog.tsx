'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
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
import type { ClassNumber, Stream, TeacherPersona, CreateClassroomRequest } from '@/types';
import { CLASS_OPTIONS, STREAM_OPTIONS, getSubjectsForClass, TEACHER_PERSONAS } from '@/config/curriculum';
import { Plus } from 'lucide-react';

interface CreateClassroomDialogProps {
  onCreate: (req: CreateClassroomRequest) => void;
  trigger?: React.ReactNode;
}

export function CreateClassroomDialog({ onCreate, trigger }: CreateClassroomDialogProps) {
  const [open, setOpen] = useState(false);
  const [classNumber, setClassNumber] = useState<ClassNumber>(6);
  const [stream, setStream] = useState<Stream | undefined>(undefined);
  const [subject, setSubject] = useState('');
  const [teacherPersona, setTeacherPersona] = useState<TeacherPersona>('friendly_teacher');
  const [name, setName] = useState('');

  const subjects = getSubjectsForClass(classNumber, stream);
  const needsStream = classNumber === 9 || classNumber === 10;

  // Track class/stream as a key to reset subject when they change
  const selectionKey = useMemo(() => `${classNumber}-${stream || 'none'}`, [classNumber, stream]);
  const [prevKey, setPrevKey] = useState(selectionKey);
  if (selectionKey !== prevKey) {
    setPrevKey(selectionKey);
    setSubject('');
  }

  const selectedSubject = subjects.find((s) => s.value === subject);

  const handleCreate = () => {
    if (!subject || !selectedSubject) return;

    const req: CreateClassroomRequest = {
      classNumber,
      stream: needsStream ? stream : undefined,
      subject,
      subjectLabel: selectedSubject.label,
      subjectIcon: selectedSubject.icon,
      name: name.trim() || undefined,
      teacher_persona: teacherPersona,
    };

    onCreate(req);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setClassNumber(6);
    setStream(undefined);
    setSubject('');
    setTeacherPersona('friendly_teacher');
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Classroom
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Classroom</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Class Number */}
          <div className="space-y-2">
            <Label>Class</Label>
            <Select
              value={String(classNumber)}
              onValueChange={(v) => setClassNumber(Number(v) as ClassNumber)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stream (for class 9-10) */}
          {needsStream && (
            <div className="space-y-2">
              <Label>Stream</Label>
              <Select
                value={stream || ''}
                onValueChange={(v) => setStream(v as Stream)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {STREAM_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher Persona */}
          <div className="space-y-2">
            <Label>Teacher Style</Label>
            <Select
              value={teacherPersona}
              onValueChange={(v) => setTeacherPersona(v as TeacherPersona)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher style" />
              </SelectTrigger>
              <SelectContent>
                {TEACHER_PERSONAS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.icon} {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Name */}
          <div className="space-y-2">
            <Label>Classroom Name (optional)</Label>
            <Input
              placeholder={selectedSubject ? `${selectedSubject.label} - Class ${classNumber}` : 'Auto-generated'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!subject}
          >
            Create Classroom
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
