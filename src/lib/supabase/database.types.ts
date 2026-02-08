export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  the_brief: {
    Tables: {
      articles: {
        Row: {
          id: string;
          url: string;
          title: string;
          headline: string | null;
          summary: string | null;
          thumbnail_url: string | null;
          source_name: string | null;
          source_favicon: string | null;
          author: string | null;
          published_at: string | null;
          ingested_at: string;
          ingested_by: string | null;
          raw_content: string | null;
          status: string;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          title: string;
          headline?: string | null;
          summary?: string | null;
          thumbnail_url?: string | null;
          source_name?: string | null;
          source_favicon?: string | null;
          author?: string | null;
          published_at?: string | null;
          ingested_at?: string;
          ingested_by?: string | null;
          raw_content?: string | null;
          status?: string;
          search_vector?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          title?: string;
          headline?: string | null;
          summary?: string | null;
          thumbnail_url?: string | null;
          source_name?: string | null;
          source_favicon?: string | null;
          author?: string | null;
          published_at?: string | null;
          ingested_at?: string;
          ingested_by?: string | null;
          raw_content?: string | null;
          status?: string;
          search_vector?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      article_tags: {
        Row: {
          article_id: string;
          tag_id: string;
          source: string;
        };
        Insert: {
          article_id: string;
          tag_id: string;
          source?: string;
        };
        Update: {
          article_id?: string;
          tag_id?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_tags_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_tags_tag_id_fkey';
            columns: ['tag_id'];
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          team: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          team?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          team?: string | null;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      newsletters: {
        Row: {
          id: string;
          title: string;
          created_by: string | null;
          template_id: string;
          brand_template: string | null;
          status: string;
          published_url: string | null;
          published_at: string | null;
          config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          created_by?: string | null;
          template_id: string;
          brand_template?: string | null;
          status?: string;
          published_url?: string | null;
          published_at?: string | null;
          config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          created_by?: string | null;
          template_id?: string;
          brand_template?: string | null;
          status?: string;
          published_url?: string | null;
          published_at?: string | null;
          config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'newsletters_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      newsletter_articles: {
        Row: {
          newsletter_id: string;
          article_id: string;
          position: number;
          section: string | null;
          custom_headline: string | null;
          custom_summary: string | null;
        };
        Insert: {
          newsletter_id: string;
          article_id: string;
          position: number;
          section?: string | null;
          custom_headline?: string | null;
          custom_summary?: string | null;
        };
        Update: {
          newsletter_id?: string;
          article_id?: string;
          position?: number;
          section?: string | null;
          custom_headline?: string | null;
          custom_summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'newsletter_articles_newsletter_id_fkey';
            columns: ['newsletter_id'];
            referencedRelation: 'newsletters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'newsletter_articles_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
        ];
      };
      feed_sources: {
        Row: {
          id: string;
          name: string;
          url: string;
          feed_type: string;
          active: boolean;
          last_fetched_at: string | null;
          fetch_interval_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          feed_type?: string;
          active?: boolean;
          last_fetched_at?: string | null;
          fetch_interval_minutes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          feed_type?: string;
          active?: boolean;
          last_fetched_at?: string | null;
          fetch_interval_minutes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases
export type Article = Database['the_brief']['Tables']['articles']['Row'];
export type ArticleInsert = Database['the_brief']['Tables']['articles']['Insert'];
export type ArticleUpdate = Database['the_brief']['Tables']['articles']['Update'];

export type Tag = Database['the_brief']['Tables']['tags']['Row'];
export type TagInsert = Database['the_brief']['Tables']['tags']['Insert'];

export type ArticleTag = Database['the_brief']['Tables']['article_tags']['Row'];

export type Profile = Database['the_brief']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['the_brief']['Tables']['profiles']['Update'];

export type Newsletter = Database['the_brief']['Tables']['newsletters']['Row'];
export type NewsletterInsert = Database['the_brief']['Tables']['newsletters']['Insert'];
export type NewsletterUpdate = Database['the_brief']['Tables']['newsletters']['Update'];

export type NewsletterArticle = Database['the_brief']['Tables']['newsletter_articles']['Row'];
export type NewsletterArticleInsert = Database['the_brief']['Tables']['newsletter_articles']['Insert'];

export type FeedSource = Database['the_brief']['Tables']['feed_sources']['Row'];
export type FeedSourceInsert = Database['the_brief']['Tables']['feed_sources']['Insert'];
export type FeedSourceUpdate = Database['the_brief']['Tables']['feed_sources']['Update'];
