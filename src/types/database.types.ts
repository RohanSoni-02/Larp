export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          larp_check_id: string | null;
          parent_id: string | null;
          session_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          larp_check_id?: string | null;
          parent_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          larp_check_id?: string | null;
          parent_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_larp_check_id_fkey";
            columns: ["larp_check_id"];
            isOneToOne: false;
            referencedRelation: "larp_checks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      coop_rooms: {
        Row: {
          created_at: string;
          created_by: string | null;
          ended_at: string | null;
          id: string;
          skill_id: string;
          started_at: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          ended_at?: string | null;
          id?: string;
          skill_id: string;
          started_at?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          ended_at?: string | null;
          id?: string;
          skill_id?: string;
          started_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coop_rooms_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coop_rooms_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          guild_id: string;
          id: string;
          place: string | null;
          starts_at: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          guild_id: string;
          id?: string;
          place?: string | null;
          starts_at: string;
          title: string;
        };
        Update: {
          created_at?: string;
          guild_id?: string;
          id?: string;
          place?: string | null;
          starts_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback_requests: {
        Row: {
          created_at: string;
          id: string;
          mentor_id: string;
          message: string;
          requester_id: string;
          responded_at: string | null;
          response: string | null;
          session_id: string | null;
          skill_id: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          mentor_id: string;
          message: string;
          requester_id: string;
          responded_at?: string | null;
          response?: string | null;
          session_id?: string | null;
          skill_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          mentor_id?: string;
          message?: string;
          requester_id?: string;
          responded_at?: string | null;
          response?: string | null;
          session_id?: string | null;
          skill_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_requests_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_requests_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_requests_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          followee_id: string;
          follower_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          followee_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey";
            columns: ["followee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      glowup_jobs: {
        Row: {
          created_at: string;
          error: string | null;
          first_media_id: string | null;
          id: string;
          latest_media_id: string | null;
          output_media_id: string | null;
          skill_id: string;
          status: Database["public"]["Enums"]["glowup_status"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          error?: string | null;
          first_media_id?: string | null;
          id?: string;
          latest_media_id?: string | null;
          output_media_id?: string | null;
          skill_id: string;
          status?: Database["public"]["Enums"]["glowup_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          first_media_id?: string | null;
          id?: string;
          latest_media_id?: string | null;
          output_media_id?: string | null;
          skill_id?: string;
          status?: Database["public"]["Enums"]["glowup_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "glowup_jobs_first_media_id_fkey";
            columns: ["first_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "glowup_jobs_latest_media_id_fkey";
            columns: ["latest_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "glowup_jobs_output_media_id_fkey";
            columns: ["output_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "glowup_jobs_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "glowup_jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      guild_members: {
        Row: {
          guild_id: string;
          joined_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          guild_id: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          guild_id?: string;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guild_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      guilds: {
        Row: {
          city: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          place: string | null;
          skill_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          place?: string | null;
          skill_id?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          place?: string | null;
          skill_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guilds_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guilds_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      kudos: {
        Row: {
          created_at: string;
          giver_id: string;
          id: string;
          label: string;
          larp_check_id: string | null;
          session_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          giver_id: string;
          id?: string;
          label: string;
          larp_check_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          created_at?: string;
          giver_id?: string;
          id?: string;
          label?: string;
          larp_check_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kudos_giver_id_fkey";
            columns: ["giver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudos_larp_check_id_fkey";
            columns: ["larp_check_id"];
            isOneToOne: false;
            referencedRelation: "larp_checks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudos_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      larp_check_prefs: {
        Row: {
          days: number[];
          enabled: boolean;
          end_minute: number;
          start_minute: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          days?: number[];
          enabled?: boolean;
          end_minute?: number;
          start_minute?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          days?: number[];
          enabled?: boolean;
          end_minute?: number;
          start_minute?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "larp_check_prefs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      larp_check_schedule: {
        Row: {
          fire_at: string;
          local_date: string;
          user_id: string;
          window_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          fire_at: string;
          local_date: string;
          user_id: string;
          window_id?: string | null;
        };
        Update: {
          fire_at?: string;
          local_date?: string;
          user_id?: string;
          window_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "larp_check_schedule_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "larp_check_schedule_window_id_fkey";
            columns: ["window_id"];
            isOneToOne: false;
            referencedRelation: "larp_check_windows";
            referencedColumns: ["id"];
          },
        ];
      };
      larp_check_windows: {
        Row: {
          fired_at: string;
          id: string;
          region: string;
          user_id: string | null;
          window_date: string;
        };
        ComputedFields: never;
        Insert: {
          fired_at: string;
          id?: string;
          region: string;
          user_id?: string | null;
          window_date: string;
        };
        Update: {
          fired_at?: string;
          id?: string;
          region?: string;
          user_id?: string | null;
          window_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "larp_check_windows_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      larp_checks: {
        Row: {
          created_at: string;
          id: string;
          is_late: boolean;
          posted_at: string;
          selfie_media_id: string | null;
          skill_id: string;
          user_id: string;
          window_id: string;
          work_media_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_late?: boolean;
          posted_at?: string;
          selfie_media_id?: string | null;
          skill_id: string;
          user_id: string;
          window_id: string;
          work_media_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_late?: boolean;
          posted_at?: string;
          selfie_media_id?: string | null;
          skill_id?: string;
          user_id?: string;
          window_id?: string;
          work_media_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "larp_checks_selfie_media_id_fkey";
            columns: ["selfie_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "larp_checks_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "larp_checks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "larp_checks_window_id_fkey";
            columns: ["window_id"];
            isOneToOne: false;
            referencedRelation: "larp_check_windows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "larp_checks_work_media_id_fkey";
            columns: ["work_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          created_at: string;
          duration_ms: number | null;
          id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          larp_check_id: string | null;
          moderation: Json | null;
          owner_id: string;
          session_id: string | null;
          status: Database["public"]["Enums"]["media_status"];
          storage_key: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duration_ms?: number | null;
          id?: string;
          kind: Database["public"]["Enums"]["media_kind"];
          larp_check_id?: string | null;
          moderation?: Json | null;
          owner_id: string;
          session_id?: string | null;
          status?: Database["public"]["Enums"]["media_status"];
          storage_key: string;
        };
        Update: {
          created_at?: string;
          duration_ms?: number | null;
          id?: string;
          kind?: Database["public"]["Enums"]["media_kind"];
          larp_check_id?: string | null;
          moderation?: Json | null;
          owner_id?: string;
          session_id?: string | null;
          status?: Database["public"]["Enums"]["media_status"];
          storage_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_larp_check_fk";
            columns: ["larp_check_id"];
            isOneToOne: false;
            referencedRelation: "larp_checks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      node_progress: {
        Row: {
          landed_at: string | null;
          node_id: string;
          proof_session_id: string | null;
          sessions_count: number;
          status: Database["public"]["Enums"]["node_status"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          landed_at?: string | null;
          node_id: string;
          proof_session_id?: string | null;
          sessions_count?: number;
          status?: Database["public"]["Enums"]["node_status"];
          user_id: string;
        };
        Update: {
          landed_at?: string | null;
          node_id?: string;
          proof_session_id?: string | null;
          sessions_count?: number;
          status?: Database["public"]["Enums"]["node_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "node_progress_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "skill_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "node_progress_proof_session_id_fkey";
            columns: ["proof_session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "node_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          created_at: string;
          data: NonNullable<Json>;
          id: string;
          read_at: string | null;
          recipient_id: string;
          type: Database["public"]["Enums"]["notification_type"];
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          type: Database["public"]["Enums"]["notification_type"];
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_color: string;
          bio: string | null;
          class_title: string | null;
          created_at: string;
          display_name: string;
          handle: string;
          id: string;
          larper_level: number;
          onboarded_at: string | null;
          reminder_time: string | null;
          show_on_leaderboards: boolean;
          timezone: string;
          xp_total: number;
        };
        ComputedFields: never;
        Insert: {
          avatar_color?: string;
          bio?: string | null;
          class_title?: string | null;
          created_at?: string;
          display_name?: string;
          handle: string;
          id: string;
          larper_level?: number;
          onboarded_at?: string | null;
          reminder_time?: string | null;
          show_on_leaderboards?: boolean;
          timezone?: string;
          xp_total?: number;
        };
        Update: {
          avatar_color?: string;
          bio?: string | null;
          class_title?: string | null;
          created_at?: string;
          display_name?: string;
          handle?: string;
          id?: string;
          larper_level?: number;
          onboarded_at?: string | null;
          reminder_time?: string | null;
          show_on_leaderboards?: boolean;
          timezone?: string;
          xp_total?: number;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          expo_token: string;
          id: string;
          last_seen_at: string;
          platform: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          expo_token: string;
          id?: string;
          last_seen_at?: string;
          platform: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expo_token?: string;
          id?: string;
          last_seen_at?: string;
          platform?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quest_participants: {
        Row: {
          joined_at: string;
          progress_days: number;
          quest_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          joined_at?: string;
          progress_days?: number;
          quest_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string;
          progress_days?: number;
          quest_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quest_participants_quest_id_fkey";
            columns: ["quest_id"];
            isOneToOne: false;
            referencedRelation: "quests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quest_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quests: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string;
          ends_on: string;
          goal_days: number;
          id: string;
          skill_id: string | null;
          starts_on: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description: string;
          ends_on: string;
          goal_days: number;
          id?: string;
          skill_id?: string | null;
          starts_on: string;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          ends_on?: string;
          goal_days?: number;
          id?: string;
          skill_id?: string | null;
          starts_on?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quests_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          status: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id: string;
          status?: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          status?: Database["public"]["Enums"]["report_status"];
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvps: {
        Row: {
          created_at: string;
          event_id: string;
          status: Database["public"]["Enums"]["rsvp_status"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_id: string;
          status?: Database["public"]["Enums"]["rsvp_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          status?: Database["public"]["Enums"]["rsvp_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rsvps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saves: {
        Row: {
          created_at: string;
          larp_check_id: string | null;
          session_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          larp_check_id?: string | null;
          session_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          larp_check_id?: string | null;
          session_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saves_larp_check_id_fkey";
            columns: ["larp_check_id"];
            isOneToOne: false;
            referencedRelation: "larp_checks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saves_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      session_templates: {
        Row: {
          blocks: NonNullable<Json>;
          created_at: string;
          id: string;
          name: string;
          skill_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          blocks: NonNullable<Json>;
          created_at?: string;
          id?: string;
          name: string;
          skill_id?: string | null;
          user_id?: string;
        };
        Update: {
          blocks?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          name?: string;
          skill_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_templates_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          client_uuid: string;
          created_at: string;
          duration_sec: number;
          id: string;
          label: string;
          landed_node: boolean;
          node_id: string | null;
          note: string | null;
          room_id: string | null;
          skill_id: string;
          started_at: string;
          user_id: string;
          visibility: Database["public"]["Enums"]["visibility_level"];
        };
        ComputedFields: never;
        Insert: {
          client_uuid: string;
          created_at?: string;
          duration_sec: number;
          id?: string;
          label?: string;
          landed_node?: boolean;
          node_id?: string | null;
          note?: string | null;
          room_id?: string | null;
          skill_id: string;
          started_at: string;
          user_id: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Update: {
          client_uuid?: string;
          created_at?: string;
          duration_sec?: number;
          id?: string;
          label?: string;
          landed_node?: boolean;
          node_id?: string | null;
          note?: string | null;
          room_id?: string | null;
          skill_id?: string;
          started_at?: string;
          user_id?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Relationships: [
          {
            foreignKeyName: "sessions_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "skill_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_room_fk";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "coop_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_branches: {
        Row: {
          color: string | null;
          id: string;
          name: string;
          position: number;
          skill_id: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string | null;
          id?: string;
          name: string;
          position?: number;
          skill_id: string;
        };
        Update: {
          color?: string | null;
          id?: string;
          name?: string;
          position?: number;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_branches_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_node_edges: {
        Row: {
          child_id: string;
          parent_id: string;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          parent_id: string;
        };
        Update: {
          child_id?: string;
          parent_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_node_edges_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "skill_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skill_node_edges_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "skill_nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_nodes: {
        Row: {
          branch_id: string;
          description: string | null;
          id: string;
          is_milestone: boolean;
          name: string;
          position: number;
          requires_video: boolean;
          sessions_to_land: number;
        };
        ComputedFields: never;
        Insert: {
          branch_id: string;
          description?: string | null;
          id?: string;
          is_milestone?: boolean;
          name: string;
          position?: number;
          requires_video?: boolean;
          sessions_to_land?: number;
        };
        Update: {
          branch_id?: string;
          description?: string | null;
          id?: string;
          is_milestone?: boolean;
          name?: string;
          position?: number;
          requires_video?: boolean;
          sessions_to_land?: number;
        };
        Relationships: [
          {
            foreignKeyName: "skill_nodes_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "skill_branches";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          blurb: string | null;
          category: Database["public"]["Enums"]["skill_category"];
          class_title: string;
          color: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_custom: boolean;
          kudo_label: string;
          lower_name: string;
          merged_into: string | null;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["skill_status"];
        };
        ComputedFields: never;
        Insert: {
          blurb?: string | null;
          category: Database["public"]["Enums"]["skill_category"];
          class_title?: string;
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_custom?: boolean;
          kudo_label?: string;
          lower_name: string;
          merged_into?: string | null;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["skill_status"];
        };
        Update: {
          blurb?: string | null;
          category?: Database["public"]["Enums"]["skill_category"];
          class_title?: string;
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_custom?: boolean;
          kudo_label?: string;
          lower_name?: string;
          merged_into?: string | null;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["skill_status"];
        };
        Relationships: [
          {
            foreignKeyName: "skills_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skills_merged_into_fkey";
            columns: ["merged_into"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      standard_attempts: {
        Row: {
          created_at: string;
          id: string;
          note: string | null;
          result_index: number | null;
          session_id: string;
          standard_id: string;
          tier_at_attempt: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          note?: string | null;
          result_index?: number | null;
          session_id: string;
          standard_id: string;
          tier_at_attempt?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string | null;
          result_index?: number | null;
          session_id?: string;
          standard_id?: string;
          tier_at_attempt?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "standard_attempts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standard_attempts_standard_id_fkey";
            columns: ["standard_id"];
            isOneToOne: false;
            referencedRelation: "standards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standard_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      standards: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          result_ladder: NonNullable<Json>;
          skill_id: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          result_ladder?: NonNullable<Json>;
          skill_id: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          result_ladder?: NonNullable<Json>;
          skill_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "standards_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      streak_shield_events: {
        Row: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["shield_event_kind"];
          local_date: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["shield_event_kind"];
          local_date: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["shield_event_kind"];
          local_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "streak_shield_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tier_history: {
        Row: {
          achieved_at: string;
          id: string;
          skill_id: string;
          tier: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          achieved_at?: string;
          id?: string;
          skill_id: string;
          tier: number;
          user_id: string;
        };
        Update: {
          achieved_at?: string;
          id?: string;
          skill_id?: string;
          tier?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tier_history_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tier_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_skills: {
        Row: {
          nodes_landed: number;
          open_to_feedback: boolean;
          skill_id: string;
          started_at: string;
          tier: number;
          total_minutes: number;
          total_xp: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          nodes_landed?: number;
          open_to_feedback?: boolean;
          skill_id: string;
          started_at?: string;
          tier?: number;
          total_minutes?: number;
          total_xp?: number;
          user_id: string;
        };
        Update: {
          nodes_landed?: number;
          open_to_feedback?: boolean;
          skill_id?: string;
          started_at?: string;
          tier?: number;
          total_minutes?: number;
          total_xp?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_skills_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_streaks: {
        Row: {
          current_streak: number;
          last_activity_local_date: string | null;
          longest_streak: number;
          shields: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          current_streak?: number;
          last_activity_local_date?: string | null;
          longest_streak?: number;
          shields?: number;
          user_id: string;
        };
        Update: {
          current_streak?: number;
          last_activity_local_date?: string | null;
          longest_streak?: number;
          shields?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vouches: {
        Row: {
          created_at: string;
          flagged: boolean;
          id: string;
          skill_id: string;
          vouchee_id: string;
          voucher_id: string;
          weight: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          flagged?: boolean;
          id?: string;
          skill_id: string;
          vouchee_id: string;
          voucher_id: string;
          weight?: number;
        };
        Update: {
          created_at?: string;
          flagged?: boolean;
          id?: string;
          skill_id?: string;
          vouchee_id?: string;
          voucher_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "vouches_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouches_vouchee_id_fkey";
            columns: ["vouchee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouches_voucher_id_fkey";
            columns: ["voucher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      xp_events: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          reason: Database["public"]["Enums"]["xp_reason"];
          skill_id: string | null;
          source_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          reason: Database["public"]["Enums"]["xp_reason"];
          skill_id?: string | null;
          source_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          reason?: Database["public"]["Enums"]["xp_reason"];
          skill_id?: string | null;
          source_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "xp_events_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "xp_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_read_media_object: { Args: { p_key: string }; Returns: boolean };
      cast_vouch: { Args: { p_skill_id: string; p_vouchee_id: string }; Returns: undefined };
      delete_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      dev_trigger_larp_check: { Args: { p_region?: string }; Returns: string };
      fire_due_larp_checks: { Args: Record<PropertyKey, never>; Returns: number };
      get_feedback_requests: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          direction: string;
          id: string;
          media_key: string;
          media_kind: string;
          message: string;
          other_color: string;
          other_id: string;
          other_name: string;
          responded_at: string;
          response: string;
          session_id: string;
          session_label: string;
          session_minutes: number;
          session_note: string;
          skill_id: string;
          skill_name: string;
          status: string;
        }[];
      };
      get_leaderboard: {
        Args: {
          p_days?: number;
          p_following_only?: boolean;
          p_guild_id?: string;
          p_skill_id?: string;
        };
        Returns: {
          avatar_color: string;
          display_name: string;
          handle: string;
          minutes: number;
          nodes_landed: number;
          rank_position: number;
          sessions: number;
          tier: number;
          user_id: string;
        }[];
      };
      has_posted_larp_check: { Args: { p_window_id: string }; Returns: boolean };
      list_mentors: {
        Args: { p_skill_id: string };
        Returns: {
          answered: number;
          avatar_color: string;
          display_name: string;
          handle: string;
          tier: number;
          user_id: string;
        }[];
      };
      mark_node_in_progress: { Args: { p_node_id: string }; Returns: undefined };
      mark_notifications_read: { Args: Record<PropertyKey, never>; Returns: undefined };
      plan_larp_checks: { Args: { p_user_id?: string }; Returns: number };
      refresh_profile_caches: { Args: { p_user_id: string }; Returns: undefined };
      refresh_user_skill_tier: { Args: { p_skill_id: string; p_user_id: string }; Returns: number };
      remove_vouch: { Args: { p_skill_id: string; p_vouchee_id: string }; Returns: undefined };
      request_feedback: {
        Args: { p_mentor_id: string; p_message: string; p_session_id: string; p_skill_id: string };
        Returns: string;
      };
      respond_feedback: {
        Args: { p_decline?: boolean; p_request_id: string; p_response: string };
        Returns: undefined;
      };
      save_session: {
        Args: {
          p_client_uuid: string;
          p_duration_sec: number;
          p_label?: string;
          p_landed_node?: boolean;
          p_node_id?: string;
          p_note?: string;
          p_room_id?: string;
          p_skill_id: string;
          p_started_at: string;
          p_visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Returns: Json;
      };
      send_expo_push: {
        Args: { p_body: string; p_data?: Json; p_title: string; p_user_id: string };
        Returns: undefined;
      };
      set_larp_check_prefs: {
        Args: {
          p_days: number[];
          p_enabled: boolean;
          p_end_minute: number;
          p_start_minute: number;
        };
        Returns: undefined;
      };
      set_open_to_feedback: { Args: { p_open: boolean; p_skill_id: string }; Returns: undefined };
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      glowup_status: "queued" | "processing" | "done" | "failed";
      media_kind: "image" | "video";
      media_status: "pending" | "approved" | "rejected";
      node_status: "in_progress" | "landed";
      notification_type:
        | "kudos"
        | "comment"
        | "follow"
        | "tier_up"
        | "vouch"
        | "larp_check"
        | "quest"
        | "system";
      report_status: "open" | "resolved" | "dismissed";
      rsvp_status: "going" | "maybe";
      shield_event_kind: "earned" | "used";
      skill_category:
        | "music"
        | "visual_art"
        | "crafts"
        | "food"
        | "fitness"
        | "mind"
        | "tech"
        | "performance"
        | "outdoors";
      skill_status: "pending" | "approved" | "rejected" | "merged";
      visibility_level: "public" | "followers" | "private";
      xp_reason: "session" | "node_landed" | "streak_bonus" | "larp_check" | "quest_bonus";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      glowup_status: ["queued", "processing", "done", "failed"],
      media_kind: ["image", "video"],
      media_status: ["pending", "approved", "rejected"],
      node_status: ["in_progress", "landed"],
      notification_type: [
        "kudos",
        "comment",
        "follow",
        "tier_up",
        "vouch",
        "larp_check",
        "quest",
        "system",
      ],
      report_status: ["open", "resolved", "dismissed"],
      rsvp_status: ["going", "maybe"],
      shield_event_kind: ["earned", "used"],
      skill_category: [
        "music",
        "visual_art",
        "crafts",
        "food",
        "fitness",
        "mind",
        "tech",
        "performance",
        "outdoors",
      ],
      skill_status: ["pending", "approved", "rejected", "merged"],
      visibility_level: ["public", "followers", "private"],
      xp_reason: ["session", "node_landed", "streak_bonus", "larp_check", "quest_bonus"],
    },
  },
} as const;
