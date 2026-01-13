"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';

interface AreaContextEditorProps {
  initialValue?: string;
  onSave: (text: string) => Promise<void>;
  areaName?: string;
}

/**
 * Converte texto puro para formato com bullets
 * Cada linha não vazia recebe "• " no início
 */
function textToBullets(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      // Se a linha já começa com bullet, manter; senão, adicionar
      if (trimmed.startsWith('• ')) {
        return trimmed;
      }
      return trimmed ? `• ${trimmed}` : '';
    })
    .join('\n');
}

/**
 * Converte texto com bullets para texto puro
 * Remove "• " do início de cada linha, mantém quebras de linha
 */
function bulletsToText(bulletsText: string): string {
  if (!bulletsText) return '';
  return bulletsText
    .split('\n')
    .map(line => {
      // Remove "• " do início se existir
      const trimmed = line.trim();
      if (trimmed.startsWith('• ')) {
        return trimmed.substring(2);
      }
      return trimmed;
    })
    .join('\n');
}

export function AreaContextEditor({ initialValue, onSave, areaName }: AreaContextEditorProps) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Converter texto inicial para bullets ao carregar
  useEffect(() => {
    if (initialValue) {
      setText(textToBullets(initialValue));
    } else {
      setText('');
    }
  }, [initialValue]);

  /**
   * Handler para Enter: insere "• " automaticamente na nova linha
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = text;
      
      const textBeforeCursor = currentText.substring(0, start);
      const textAfterCursor = currentText.substring(end);
      
      // Inserir nova linha com bullet
      const newText = textBeforeCursor + '\n• ' + textAfterCursor;
      setText(newText);
      
      // Ajustar posição do cursor após atualização
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + 3; // "\n• "
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
        }
      }, 0);
    }
  };

  /**
   * Handler para salvar: converte bullets para texto puro antes de salvar
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const plainText = bulletsToText(text);
      await onSave(plainText);
      toast({
        title: "Contextualização salva",
        description: areaName 
          ? `A contextualização da área "${areaName}" foi salva com sucesso.`
          : "Contextualização salva com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar contextualização:', error);
      toast({
        variant: 'destructive',
        title: "Erro ao salvar",
        description: "Não foi possível salvar a contextualização. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Contextualização Geral da Área
          {areaName && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({areaName})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite a contextualização da área... (pressione Enter para nova linha com bullet)"
            className="min-h-[200px] resize-y font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Cada linha será formatada automaticamente com bullet. Pressione Enter para criar uma nova linha.
          </p>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
