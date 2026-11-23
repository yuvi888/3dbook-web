export interface BookItem {
  id: string;
  title: string;
  year: string;
  pages: number;
  color: string;
  spineColor: string;
  accentColor: string;
  summary: string;
  height?: number; // 0.75 - 0.95
  thickness?: number; // 0.10 - 0.18
  depth?: number; // 0.50 - 0.62
}

export interface BookshelfItem {
  id: string;
  author: string;
  genre: string;
  description: string;
  books: BookItem[];
  t: number; // position on curve [0, 1]
  side: 'left' | 'right';
}
