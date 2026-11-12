import { supabase } from '@/src/lib/supabase';
import type { SkillCategory } from '@/src/types/app';

/** The prototype's full "Add a skill" catalogue: category → candidate names. */
export const CATEGORIES: { category: SkillCategory; title: string; names: string[] }[] = [
  { category: 'music', title: 'Music', names: ['Piano', 'Guitar', 'Ukulele', 'Violin', 'Drums', 'Singing', 'DJing', 'Music production', 'Beatboxing', 'Harmonica'] },
  { category: 'visual_art', title: 'Visual art', names: ['Drawing', 'Digital art', 'Watercolor', 'Oil/acrylic painting', 'Calligraphy', 'Hand lettering', 'Tattoo flash design', 'Photography', 'Pixel art', 'Animation'] },
  { category: 'crafts', title: 'Crafts and making', names: ['Candle making', 'Pottery', 'Crochet', 'Knitting', 'Embroidery', 'Sewing', 'Resin art', 'Jewelry making', 'Soap making', 'Woodworking', 'Leatherwork', 'Bookbinding', 'Origami', 'Model building', 'Lego builds'] },
  { category: 'food', title: 'Food and drink', names: ['Baking', 'Cake decorating', 'Bread and sourdough', 'Cooking specific cuisines', 'Latte art', 'Mixology', 'Coffee brewing', 'Fermentation', 'Knife skills'] },
  { category: 'fitness', title: 'Fitness and movement', names: ['Weightlifting', 'Calisthenics', 'Running', 'Yoga flexibility goals', 'Climbing', 'Skateboarding', 'Rollerblading', 'Dance styles', 'Martial arts', 'Juggling', 'Parkour', 'Swimming'] },
  { category: 'mind', title: 'Mind and language', names: ['Languages', 'Chess', 'Rubik’s cube speedsolving', 'Memory techniques', 'Speed reading', 'Public speaking', 'Poetry', 'Creative writing'] },
  { category: 'tech', title: 'Tech and digital', names: ['Coding projects', 'Video editing', '3D modeling', 'Game dev', 'Electronics/Arduino builds', 'Mechanical keyboard building', 'Photo editing'] },
  { category: 'performance', title: 'Performance and quirky', names: ['Magic tricks', 'Card flourishing', 'Stand-up comedy', 'Whistling', 'Pen spinning', 'Yo-yo', 'Kendama', 'Freestyle rapping', 'Impressions'] },
  { category: 'outdoors', title: 'Outdoors and home', names: ['Gardening', 'Plant propagation', 'Fishing', 'Foraging', 'Interior styling', 'Car detailing', 'Bonsai'] },
];

export const SWATCHES = ['#0EA5E9', '#22C55E', '#EAB308', '#F97316', '#EF4444', '#EC4899', '#8B5CF6', '#64748B'];

/** Starter tree template for user-created skills (from the prototype). */
export const TREE_TEMPLATE: { branch: string; steps: string[] }[] = [
  { branch: 'Basics', steps: ['First attempt', 'Core fundamentals', '10 sessions logged'] },
  { branch: 'Technique', steps: ['A key technique', 'Combine two techniques', 'Clean, repeatable result'] },
  { branch: 'Projects', steps: ['First finished piece', 'A piece you’re proud of', 'Teach someone else'] },
];

export type CreateSkillInput = {
  name: string;
  category: SkillCategory;
  color: string;
  kudoLabel: string;
  classTitle: string;
  branches: { name: string; steps: string[] }[];
};

/**
 * Create a custom skill (status "pending" — usable by its creator immediately,
 * reviewed before appearing in everyone's search) with its tree and linear
 * edges. Near-duplicates are caught by name comparison before calling this.
 */
export async function createCustomSkill(meId: string, input: CreateSkillInput): Promise<string> {
  const slug = `c-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)}-${Date.now().toString(36)}`;

  const { data: skill, error } = await supabase
    .from('skills')
    .insert({
      slug,
      name: input.name,
      lower_name: input.name.toLowerCase(),
      category: input.category,
      color: input.color,
      kudo_label: input.kudoLabel || 'Nice progress',
      class_title: input.classTitle || 'Adventurer',
      blurb: 'Community skill',
      is_custom: true,
      status: 'pending',
      created_by: meId,
    })
    .select('id')
    .single();
  if (error) throw error;

  const branches = input.branches.filter((b) => b.steps.some((s) => s.trim()));
  for (const [bi, branch] of branches.entries()) {
    const { data: branchRow, error: branchError } = await supabase
      .from('skill_branches')
      .insert({ skill_id: skill.id, name: branch.name.trim() || `Branch ${bi + 1}`, position: bi })
      .select('id')
      .single();
    if (branchError) throw branchError;

    const steps = branch.steps.map((s) => s.trim()).filter(Boolean).slice(0, 4);
    const nodeIds: string[] = [];
    for (const [ni, step] of steps.entries()) {
      const { data: nodeRow, error: nodeError } = await supabase
        .from('skill_nodes')
        .insert({
          branch_id: branchRow.id,
          name: step,
          position: ni,
          is_milestone: ni === steps.length - 1,
        })
        .select('id')
        .single();
      if (nodeError) throw nodeError;
      nodeIds.push(nodeRow.id);
    }
    for (let i = 1; i < nodeIds.length; i++) {
      const { error: edgeError } = await supabase
        .from('skill_node_edges')
        .insert({ parent_id: nodeIds[i - 1]!, child_id: nodeIds[i]! });
      if (edgeError) throw edgeError;
    }
  }

  return skill.id as string;
}

/** Case/ending-insensitive duplicate check ("crochet" ≈ "crocheting"). */
export function findNearDuplicate(name: string, existing: { id: string; name: string }[]): { id: string; name: string } | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(ing|ers|er|s)$/, '');
  const needle = norm(name);
  if (!needle) return null;
  return existing.find((s) => norm(s.name) === needle) ?? null;
}
