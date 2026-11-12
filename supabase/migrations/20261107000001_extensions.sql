-- 0001: extensions + enums
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create type public.skill_category as enum (
  'music', 'visual_art', 'crafts', 'food', 'fitness', 'mind', 'tech', 'performance', 'outdoors'
);

create type public.skill_status as enum ('pending', 'approved', 'rejected', 'merged');

create type public.visibility_level as enum ('public', 'followers', 'private');

create type public.media_kind as enum ('image', 'video');

create type public.media_status as enum ('pending', 'approved', 'rejected');

create type public.xp_reason as enum (
  'session', 'node_landed', 'streak_bonus', 'larp_check', 'quest_bonus'
);

create type public.node_status as enum ('in_progress', 'landed');

create type public.report_status as enum ('open', 'resolved', 'dismissed');

create type public.rsvp_status as enum ('going', 'maybe');

create type public.glowup_status as enum ('queued', 'processing', 'done', 'failed');

create type public.shield_event_kind as enum ('earned', 'used');

create type public.notification_type as enum (
  'kudos', 'comment', 'follow', 'tier_up', 'vouch', 'larp_check', 'quest', 'system'
);
