"use client";

import { useState, type KeyboardEvent, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// 定义 Topic 接口，匹配 searchTopic 返回的数据结构
export interface Topic {
  name: string;
  link: string;
  view_num: number;
  type: string;
  smart: boolean;
  id: string;
}

interface TagInputProps {
  tags?: string[];
  topics?: Topic[];
  onChange: (tags: string[] | Topic[]) => void;
  maxTags?: number;
  searchTopics: (keyword: string) => Promise<Topic[]>;
  showCommonTags?: boolean; // 是否显示公共标签
  isSettingsMode?: boolean; // 是否是设置模式（使用完整 Topic 对象）
}

export function TagInput({
  tags = [],
  topics = [],
  onChange,
  maxTags = 20,
  searchTopics,
  showCommonTags = false,
  isSettingsMode = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<Topic[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [commonTopics, setCommonTopics] = useState<Topic[]>([]);
  const [loadingCommonTags, setLoadingCommonTags] = useState(false);

  // 当前展示的标签列表（字符串或Topic对象）
  const displayTags = isSettingsMode ? topics.map(t => t.name) : tags;
  
  // 存储的标签列表（根据模式决定是字符串还是Topic对象）
  const storedItems = isSettingsMode ? topics : tags;

  // 加载公共标签
  useEffect(() => {
    if (showCommonTags) {
      const fetchCommonTags = async () => {
        setLoadingCommonTags(true);
        try {
          const response = await fetch("/api/common-tags");
          if (!response.ok) {
            throw new Error("获取公共标签失败");
          }
          const data = await response.json();
          setCommonTopics(data.tags || []);
        } catch (error) {
          console.error("获取公共标签失败:", error);
        } finally {
          setLoadingCommonTags(false);
        }
      };
      
      fetchCommonTags();
    }
  }, [showCommonTags]);

  // Debounce search function
  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    delay: number
  ) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const performSearch = useCallback(
    async (keyword: string) => {
      if (keyword.trim() === "") {
        setSearchResults([]);
        setShowSuggestions(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await searchTopics(keyword);
        setSearchResults(results);
        setShowSuggestions(results.length > 0);
        setActiveIndex(-1); // Reset active index when search results change
      } catch (error) {
        console.error("Error searching topics:", error);
        setSearchResults([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    [searchTopics]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(performSearch, 1000), [
    performSearch,
  ]);

  useEffect(() => {
    if (inputValue) {
      debouncedSearch(inputValue);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [inputValue, debouncedSearch]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < searchResults.length) {
          addTag(searchResults[activeIndex]);
        } else if (searchResults.length > 0) {
          // If no item is highlighted but there are results, add the first one
          addTag(searchResults[0]);
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    } else if (e.key === "Enter") {
      // Prevent form submission or other default behavior if no suggestions
      e.preventDefault();
    }
  };

  const addTag = (topic: Topic) => {
    const tagName = topic.name.trim();
    if (tagName && !displayTags.includes(tagName) && displayTags.length < maxTags) {
      if (isSettingsMode) {
        const newTopics = [...topics, topic];
        onChange(newTopics);
      } else {
        const newTags = [...tags, tagName];
        onChange(newTags);
      }
      setInputValue("");
      setSearchResults([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (isSettingsMode) {
      const newTopics = topics.filter((topic) => topic.name !== tagToRemove);
      onChange(newTopics);
    } else {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      onChange(newTags);
    }
  };

  return (
    <div className="space-y-3 relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {displayTags.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-3 py-1.5"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-muted-foreground hover:text-foreground transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label={`删除标签 ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {displayTags.length === 0 && (
          <span className="text-sm text-muted-foreground">还没有添加标签</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (!showSuggestions && e.target.value.trim() !== "") {
                setShowSuggestions(true); // Show suggestions when user starts typing
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.trim() !== "" && searchResults.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={
              displayTags.length >= maxTags ? "已达到最大标签数" : "搜索并选择标签..."
            }
            disabled={displayTags.length >= maxTags}
            className="flex-1"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {displayTags.length}/{maxTags}
        </span>
      </div>

      {/* 公共标签显示 */}
      {showCommonTags && commonTopics.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">公共标签库</h4>
          <div className="flex flex-wrap gap-2">
            {commonTopics.map((topic, index) => (
              <Badge
                key={`common-${index}`}
                variant="outline"
                className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 hover:bg-accent ${
                  displayTags.includes(topic.name) ? "opacity-50" : ""
                }`}
                onClick={() => {
                  if (!displayTags.includes(topic.name) && displayTags.length < maxTags) {
                    addTag(topic);
                  }
                }}
              >
                {topic.name}
                {!displayTags.includes(topic.name) && displayTags.length < maxTags && (
                  <Plus className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {showSuggestions && searchResults.length > 0 && (
        <ScrollArea className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {searchResults.map((topic, index) => (
              <li
                key={topic.id}
                onClick={() => addTag(topic)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent ${
                  index === activeIndex ? "bg-accent" : ""
                }`}
              >
                {topic.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({topic.view_num.toLocaleString()} 次浏览)
                </span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
      {showSuggestions &&
        !isLoading &&
        searchResults.length === 0 &&
        inputValue.trim() !== "" && (
          <div className="absolute z-10 w-full mt-1 p-3 bg-card border rounded-md shadow-lg text-sm text-muted-foreground">
            没有找到相关话题。
          </div>
        )}
    </div>
  );
}
