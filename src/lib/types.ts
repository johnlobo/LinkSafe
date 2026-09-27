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
