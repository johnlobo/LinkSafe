'use client';

import { Check, X } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type TagInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
};

export function TagInput({ value: tags, onChange, allTags, placeholder, ...props }: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');

  const normalizedTags = useMemo(
    () => new Set(tags.map((tag) => tag.trim().toLowerCase())),
    [tags]
  );
  const filteredSuggestions = allTags.filter(
    (tag) =>
      !normalizedTags.has(tag.trim().toLowerCase()) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleAddTag = useCallback(
    (tag: string) => {
      const newTag = tag.trim();
      const key = newTag.toLowerCase();
      const knownTag = allTags.find((candidate) => candidate.trim().toLowerCase() === key);
      if (newTag && !normalizedTags.has(key)) {
        onChange([...tags, knownTag || newTag]);
      }
      setInputValue('');
      setSelectedSuggestion('');
      setOpen(false);
      inputRef.current?.focus();
    },
    [allTags, normalizedTags, onChange, tags]
  );

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedSuggestion('');
    setOpen(value.trim() !== '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!filteredSuggestions.length) return;
      const i = filteredSuggestions.indexOf(selectedSuggestion);
      setSelectedSuggestion(filteredSuggestions[i < filteredSuggestions.length - 1 ? i + 1 : 0]);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!filteredSuggestions.length) return;
      const i = filteredSuggestions.indexOf(selectedSuggestion);
      setSelectedSuggestion(filteredSuggestions[i > 0 ? i - 1 : filteredSuggestions.length - 1]);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestion) {
        handleAddTag(selectedSuggestion);
      } else if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    }
    if (e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) handleAddTag(inputValue);
    }
    if (e.key === 'Tab' && (open || inputValue.trim())) {
      e.preventDefault();
      if (selectedSuggestion) {
        handleAddTag(selectedSuggestion);
      } else if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    }
    if (e.key === 'Backspace' && !inputValue) {
      e.preventDefault();
      handleRemoveTag(tags[tags.length - 1]);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setSelectedSuggestion('');
    }
  };

  return (
    <div
      className={cn(
        'flex h-auto min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-sm">
          {tag}
          <button
            type="button"
            className="ml-1 h-4 w-4 rounded-full text-muted-foreground ring-offset-background transition-colors hover:bg-destructive/80 hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag);
            }}
          >
            <X size={12} />
            <span className="sr-only">Remove {tag}</span>
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              value={inputValue}
              placeholder={tags.length > 0 ? '' : placeholder}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-sm"
              {...props}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false} value={selectedSuggestion} onValueChange={setSelectedSuggestion}>
            <CommandList>
              <CommandEmpty>
                {inputValue ? `Press Enter to add "${inputValue}"` : 'Type to see suggestions.'}
              </CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddTag(tag);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        tags.includes(tag) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
