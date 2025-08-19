import { useState, useRef, useEffect } from "react";
import type { TagSelectorProps, Tag } from "~/types/forum";

export default function TagSelector({
  selectedTags,
  onTagsChange,
  maxTags = 5,
  placeholder = "Add tags...",
  disabled = false
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock data - in real implementation, this would come from an API
  const mockTags: Tag[] = [
    { id: "1", name: "JavaScript", slug: "javascript", color: "#f7df1e", usage_count: 150, created_at: "" },
    { id: "2", name: "Python", slug: "python", color: "#3776ab", usage_count: 120, created_at: "" },
    { id: "3", name: "React", slug: "react", color: "#61dafb", usage_count: 200, created_at: "" },
    { id: "4", name: "Node.js", slug: "nodejs", color: "#339933", usage_count: 80, created_at: "" },
    { id: "5", name: "TypeScript", slug: "typescript", color: "#3178c6", usage_count: 90, created_at: "" },
    { id: "6", name: "AI", slug: "ai", color: "#ff6b6b", usage_count: 300, created_at: "" },
    { id: "7", name: "Machine Learning", slug: "machine-learning", color: "#4ecdc4", usage_count: 180, created_at: "" },
    { id: "8", name: "OpenAI", slug: "openai", color: "#412991", usage_count: 220, created_at: "" },
    { id: "9", name: "Claude", slug: "claude", color: "#d97706", usage_count: 100, created_at: "" },
    { id: "10", name: "GPT", slug: "gpt", color: "#10b981", usage_count: 250, created_at: "" }
  ];

  useEffect(() => {
    if (searchValue.trim()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filtered = mockTags.filter(tag => 
          tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
          !selectedTags.some(selected => selected.id === tag.id)
        );
        setAvailableTags(filtered);
        setIsLoading(false);
      }, 200);
    } else {
      setAvailableTags(mockTags.filter(tag => 
        !selectedTags.some(selected => selected.id === tag.id)
      ));
    }
  }, [searchValue, selectedTags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: Tag) => {
    if (selectedTags.length < maxTags && !selectedTags.some(selected => selected.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
      setSearchValue("");
      setIsOpen(false);
    }
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (availableTags.length > 0) {
        addTag(availableTags[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && !searchValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1].id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Tags and Input */}
      <div className={`
        flex flex-wrap items-center gap-2 p-3 border rounded-md bg-white
        ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'cursor-text'}
        ${isOpen ? 'border-cyan-300 ring-2 ring-cyan-100' : 'border-slate-200'}
      `} onClick={() => !disabled && inputRef.current?.focus()}>
        {/* Selected Tags */}
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-md"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
                className="ml-1 text-current hover:bg-black hover:bg-opacity-10 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        {!disabled && selectedTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedTags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none text-sm"
          />
        )}

        {/* Max tags indicator */}
        {selectedTags.length >= maxTags && (
          <span className="text-xs text-slate-500">
            Max {maxTags} tags
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && selectedTags.length < maxTags && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-slate-500 text-center">
              Searching tags...
            </div>
          ) : availableTags.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center">
              {searchValue ? `No tags found for "${searchValue}"` : 'No more tags available'}
            </div>
          ) : (
            <div className="py-1">
              {availableTags.slice(0, 10).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {tag.usage_count} posts
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      <div className="mt-1 text-xs text-slate-500">
        {selectedTags.length}/{maxTags} tags selected
        {!disabled && selectedTags.length < maxTags && " • Type to search for tags"}
      </div>
    </div>
  );
}
