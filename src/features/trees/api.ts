import { supabase } from '@/src/lib/supabase';
import type { Skill, SkillTree, TreeBranch, TreeNode, UserSkill } from '@/src/types/app';

 

/** My portfolio (user_skills joined with skills), highest tier first. */
export async function getMyPortfolio(meId: string): Promise<(UserSkill & { skills: Skill })[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('user_id, skill_id, tier, total_minutes, total_xp, nodes_landed, open_to_feedback, skills ( * )')
    .eq('user_id', meId)
    .order('tier', { ascending: false })
    .order('total_xp', { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

/** Any user's portfolio (public read). */
export async function getPortfolio(userId: string): Promise<(UserSkill & { skills: Skill })[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('user_id, skill_id, tier, total_minutes, total_xp, nodes_landed, open_to_feedback, skills ( * )')
    .eq('user_id', userId)
    .order('tier', { ascending: false })
    .order('total_xp', { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

/**
 * Full tree for one skill with the viewer's node states resolved:
 * landed / in progress (n of 5) / available (previous landed) / locked.
 */
export async function getSkillTree(meId: string, skillId: string): Promise<SkillTree> {
  const [skillRes, branchesRes, progressRes, usRes] = await Promise.all([
    supabase.from('skills').select('*').eq('id', skillId).single(),
    supabase
      .from('skill_branches')
      .select('id, name, position, skill_nodes ( id, name, position, is_milestone, requires_video, sessions_to_land )')
      .eq('skill_id', skillId)
      .order('position'),
    supabase.from('node_progress').select('node_id, status, sessions_count').eq('user_id', meId),
    supabase.from('user_skills').select('total_xp').eq('user_id', meId).eq('skill_id', skillId).maybeSingle(),
  ]);
  if (skillRes.error) throw skillRes.error;
  if (branchesRes.error) throw branchesRes.error;

  const progress = new Map((progressRes.data ?? []).map((p) => [p.node_id, p]));
  let landedCount = 0;
  let totalCount = 0;

  const branches: TreeBranch[] = (branchesRes.data ?? []).map((b: any) => {
    const nodes: TreeNode[] = (b.skill_nodes ?? [])
      .sort((x: any, y: any) => x.position - y.position)
      .map((n: any, i: number, arr: any[]) => {
        const p = progress.get(n.id);
        const landed = p?.status === 'landed';
        const prevLanded = i === 0 || progress.get(arr[i - 1].id)?.status === 'landed';
        totalCount += 1;
        if (landed) landedCount += 1;
        return {
          id: n.id,
          name: n.name,
          branchIndex: b.position,
          position: n.position,
          isMilestone: n.is_milestone || i === arr.length - 1,
          requiresVideo: n.requires_video,
          sessionsToLand: n.sessions_to_land ?? 5,
          state: landed ? 'landed' : p ? 'in_progress' : prevLanded ? 'available' : 'locked',
          sessionsLogged: Math.min(p?.sessions_count ?? 0, n.sessions_to_land ?? 5),
        };
      });
    return { id: b.id, name: b.name, nodes };
  });

  return {
    skill: skillRes.data as Skill,
    branches,
    landedCount,
    totalCount,
    xp: usRes.data?.total_xp ?? 0,
  };
}

export type NodeDetail = {
  id: string;
  name: string;
  skillName: string;
  skillId: string;
  branchName: string;
  requiresVideo: boolean;
  sessionsToLand: number;
  state: TreeNode['state'];
  sessionsLogged: number;
  landedBy: { id: string; name: string; color: string }[];
};

export async function getNodeDetail(meId: string, nodeId: string): Promise<NodeDetail> {
  const { data: node, error } = await supabase
    .from('skill_nodes')
    .select('id, name, requires_video, sessions_to_land, position, skill_branches!inner ( id, name, position, skill_id, skills!inner ( id, name ) )')
    .eq('id', nodeId)
    .single();
  if (error) throw error;

  const branch = (node as any).skill_branches;
  const skillId = branch.skill_id as string;

  const [progressRes, siblingsRes, landedRes, followsRes] = await Promise.all([
    supabase.from('node_progress').select('status, sessions_count').eq('user_id', meId).eq('node_id', nodeId).maybeSingle(),
    supabase
      .from('skill_nodes')
      .select('id, position')
      .eq('branch_id', branch.id)
      .order('position'),
    supabase
      .from('node_progress')
      .select('user_id, profiles!node_progress_user_id_fkey ( display_name, avatar_color )')
      .eq('node_id', nodeId)
      .eq('status', 'landed')
      .limit(20),
    supabase.from('follows').select('followee_id').eq('follower_id', meId),
  ]);

  const siblings = siblingsRes.data ?? [];
  const myIndex = siblings.findIndex((s) => s.id === nodeId);
  const prevId = myIndex > 0 ? siblings[myIndex - 1]!.id : null;
  let prevLanded = myIndex <= 0;
  if (prevId) {
    const { data: prev } = await supabase
      .from('node_progress')
      .select('status')
      .eq('user_id', meId)
      .eq('node_id', prevId)
      .maybeSingle();
    prevLanded = prev?.status === 'landed';
  }

  const p = progressRes.data;
  const following = new Set((followsRes.data ?? []).map((f) => f.followee_id));
  const landedBy = (landedRes.data ?? [])
    .filter((r: any) => following.has(r.user_id))
    .slice(0, 6)
    .map((r: any) => ({
      id: r.user_id,
      name: r.profiles?.display_name ?? 'Larper',
      color: r.profiles?.avatar_color ?? '#5B3DF5',
    }));

  return {
    id: node.id,
    name: node.name,
    skillName: (branch as any).skills.name,
    skillId,
    branchName: branch.name,
    requiresVideo: node.requires_video,
    sessionsToLand: node.sessions_to_land ?? 5,
    state: p?.status === 'landed' ? 'landed' : p ? 'in_progress' : prevLanded ? 'available' : 'locked',
    sessionsLogged: Math.min(p?.sessions_count ?? 0, node.sessions_to_land ?? 5),
    landedBy,
  };
}

/** "Mark as in progress" goes through an RPC — node_progress is server-written. */
export async function markNodeInProgress(nodeId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_node_in_progress', { p_node_id: nodeId });
  if (error) throw error;
}
