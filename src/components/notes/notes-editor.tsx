
"use client";

import { useEffect, useCallback } from 'react';
import { useNotes } from '@/contexts/notes-context';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { debounce } from 'lodash';
import { format } from 'date-fns';

export function NotesEditor() {
  const { noteContent, setNoteContent, saveNote, isLoading, isSaving, lastUpdated } = useNotes();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(() => {
        saveNote();
    }, 1500), // 1.5 seconds debounce delay
    [saveNote]
  );
  
  useEffect(() => {
    if (!isLoading) {
        debouncedSave();
    }
    // Cleanup function to cancel any pending saves on unmount
    return () => {
        debouncedSave.cancel();
    };
  }, [noteContent, isLoading, debouncedSave]);

  if (isLoading) {
    return <Skeleton className="w-full flex-grow rounded-lg" />;
  }

  return (
    <div className="relative flex-grow flex flex-col">
      <Textarea
        placeholder="Comece a digitar suas anotações aqui..."
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        className="w-full h-full resize-none text-base p-6 flex-grow"
      />
      <div className="flex justify-end items-center h-8 px-4 py-1 text-xs">
          {isSaving ? (
            <span className="text-muted-foreground">Salvando...</span>
          ) : lastUpdated ? (
             <span className="text-muted-foreground">
                Atualizado em {format(lastUpdated, "dd/MM/yyyy 'às' HH:mm:ss")}
            </span>
          ) : (
             <span className="text-muted-foreground">Suas notas serão salvas automaticamente.</span>
          )}
      </div>
    </div>
  );
}
