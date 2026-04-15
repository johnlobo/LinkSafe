'use client';

import { Check, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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

  const handleAddTag = useCallback(
    (tag: string) => {
      const newTag = tag.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
      setOpen(false);
      inputRef.current?.focus();
    },
    [tags, onChange]
  );

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const commandRef = inputRef.current?.closest('[cmdk-root]');
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const event = new KeyboardEvent(e.nativeEvent.type, e.nativeEvent);
        commandRef?.dispatchEvent(event);
    }
    if (e.key === 'Enter') {
      // Let cmdk handle selection first. If it does, prevent default form submission.
      const selectedValue = commandRef?.querySelector('[cmdk-item][aria-selected="true"]')?.getAttribute('data-value');
      if (selectedValue) {
        e.preventDefault();
        handleAddTag(selectedValue);
        return;
      }
      
      // If no suggestion is selected, add the current input value as a new tag.
      if (inputValue) {
        e.preventDefault();
        handleAddTag(inputValue);
      }
    }
    if (e.key === 'Backspace' && !inputValue) {
      e.preventDefault();
      handleRemoveTag(tags[tags.length - 1]);
    }
  };
  
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setOpen(value.trim() !== '');
  };

  const filteredSuggestions = (currentValue: string) => {
    return allTags.filter(
      (tag) => !tags.includes(tag) && tag.toLowerCase().includes(currentValue.toLowerCase())
    );
  }

  return (
    <div
      className={cn(
        'flex h-auto min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background'
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
                <div className="flex-1">
                    <Command className="bg-transparent">
                        <CommandInput
                            ref={inputRef}
                            value={inputValue}
                            onValueChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={tags.length > 0 ? '' : placeholder}
                            className="h-auto min-h-0 w-full border-none p-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                            {...props}
                        />
                    </Command>
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <Command>
                    <CommandInput value={inputValue} onValueChange={handleInputChange} className="hidden" />
                    <CommandList>
                        <CommandEmpty>
                            {inputValue ? `Press Enter to add "${inputValue}"` : 'Type to see suggestions.'}
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredSuggestions(inputValue).map((tag) => (
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
                                    "mr-2 h-4 w-4",
                                    tags.includes(tag) ? "opacity-100" : "opacity-0"
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
