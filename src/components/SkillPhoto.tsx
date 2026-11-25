import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

import { skillPhotoUri, type SkillRef } from '@/src/features/skills/skillImages';

type SkillPhotoProps = {
  skill: SkillRef;
  /** Picks the photo within the skill's pool; pass the post id so a post keeps its photo. */
  seed: string;
  aspectRatio?: number;
  style?: StyleProp<ImageStyle>;
};

/** Skill photography for posts that have no photo of their own. */
export function SkillPhoto({ skill, seed, aspectRatio, style }: SkillPhotoProps) {
  return (
    <Image
      source={{ uri: skillPhotoUri(skill, seed) }}
      style={[styles.img, aspectRatio ? { aspectRatio } : null, style]}
      resizeMode="cover"
      accessibilityLabel={skill.name ? `${skill.name} photo` : 'Skill photo'}
    />
  );
}

const styles = StyleSheet.create({
  img: { width: '100%' },
});
