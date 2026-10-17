export type ContentType = "cientifico" | "curiosidade" | "experiencia" | "opiniao" | "analise";

export type MinAge = "all" | "13+" | "16+" | "18+";

export type PublicationStatus = "draft" | "pending_review" | "published" | "restricted" | "archived" | "removed";

export interface Author {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  title?: string;
  institution?: string;
}

export interface SourceReference {
  title: string;
  authors: string;
  year: number;
  journal?: string;
  doi?: string;
  url?: string;
  verified?: boolean;
}

export interface Mention {
  name: string;
  role: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  body_markdown: string;
  author: Author;
  category: string;
  subcategory?: string;
  content_type: ContentType;
  min_age: MinAge;
  status: PublicationStatus;
  published_at: string;
  read_time_minutes: number;
  tags: string[];
  cover_image?: string;
  video_url?: string;
  external_url?: string;
  sources?: SourceReference[];
  mentions?: Mention[];
  metrics: {
    views: number;
    bookmarks: number;
    comments_count: number;
  };
  likes_count?: number;
  shares_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface CommentItem {
  id: string;
  author: Author;
  content: string;
  created_at: string;
  likes: number;
  is_liked?: boolean;
}
