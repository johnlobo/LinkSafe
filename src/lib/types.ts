export type Bookmark = {
  id: string;
  userId?: string; // Add userId to associate bookmark with a user
  url: string;
  title: string;
  description?: string;
  tags: string[];
  favicon?: string;
  favorite?: boolean;
  createdAt: string; // ISO date string
};

export type Prompt = {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  notes?: string;
  sourceUrl?: string;
  author?: string;
  language?: string;
  model?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};
