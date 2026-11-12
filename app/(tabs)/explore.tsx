import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import SphereImageGrid from '@/components/ui/img-sphere';
import { Art } from '@/src/components/Art';
import { Avatar } from '@/src/components/Avatar';
import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { TopBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { IconButton } from '@/src/components/IconButton';
import { Scrim } from '@/src/components/Scrim';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { usePopularSessions, useSearchPeople } from '@/src/features/explore/hooks';
import { useUsableSkills } from '@/src/features/skills/hooks';
import { buildCatalogSphereImages } from '@/src/features/skills/skillImages';
import { formatDuration } from '@/src/lib/format';
import { fonts, GUTTER, useTheme } from '@/src/theme';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string | null>(null);

  const { data: skills } = useUsableSkills();
  const { data: users } = useSearchPeople(query);
  const { data: popular } = usePopularSessions(skillFilter, query);

  const exploreSphereImages = useMemo(
    () =>
      buildCatalogSphereImages(
        (skills ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          color: s.color,
          description: s.blurb ?? `See what people are practising in ${s.name}.`,
          actionLabel: skillFilter === s.id ? 'Show all skills' : `Filter by ${s.name}`,
          onAction: () => setSkillFilter((prev) => (prev === s.id ? null : s.id)),
        })),
        24,
      ),
    [skills, skillFilter],
  );

  const columns = useMemo(() => {
    const ratios = [1, 4 / 5, 3 / 4];
    const cols: (typeof popular)[] = [[], []];
    (popular ?? []).forEach((tile, i) => cols[i % 2]!.push(tile));
    return { cols, ratios };
  }, [popular]);

  const filterName = skills?.find((s) => s.id === skillFilter)?.name;

  return (
    <Screen
      scroll
      padded={false}
      edges={['top']}
      header={
        <View>
          <TopBar
            title="Explore"
            right={
              <IconButton
                name="arena"
                accessibilityLabel="Open the Arena: quests, leaderboards, rooms and guilds"
                onPress={() => router.push('/(tabs)/arena')}
              />
            }
          />
          <View style={styles.searchWrap}>
            <View
              style={[
                styles.search,
                { backgroundColor: colors.surface2, borderColor: focused ? colors.ink : 'transparent' },
              ]}
            >
              <Icon name="search" size={17} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search people and sessions"
                placeholderTextColor={colors.subtle}
                accessibilityLabel="Search people and sessions"
                returnKeyType="search"
                autoCorrect={false}
                style={[styles.searchInput, { color: colors.ink }]}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                  <View style={[styles.clear, { backgroundColor: colors.subtle }]}>
                    <Icon name="close" size={10} color={colors.bg} weight="bold" />
                  </View>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip size="sm" label="All" selected={skillFilter === null} onPress={() => setSkillFilter(null)} />
        {(skills ?? []).map((s) => (
          <Chip key={s.id} size="sm" label={s.name} selected={skillFilter === s.id} onPress={() => setSkillFilter(s.id)} color={s.color} />
        ))}
      </ScrollView>

      {users && users.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.pad}>
            <SectionHeader title="People" />
          </View>
          {users.map((u) => (
            <Pressable
              key={u.id}
              style={({ pressed }) => [styles.userRow, pressed && { backgroundColor: colors.surface2 }]}
              onPress={() => router.push({ pathname: '/user/[id]', params: { id: u.id } })}
              accessibilityLabel={`${u.name}’s profile`}
            >
              <Avatar name={u.name} color={u.color} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.userName, { color: colors.ink }]} numberOfLines={1}>
                  {u.name}
                </Text>
                <Text style={[styles.userSub, { color: colors.muted }]} numberOfLines={1}>
                  {u.portfolio || `@${u.handle}`}
                </Text>
              </View>
              <Icon name="chevron-right" size={14} color={colors.subtle} weight="semibold" />
            </Pressable>
          ))}
        </View>
      ) : null}

      {(skills ?? []).length > 1 && !query ? (
        <View style={styles.pad}>
          <View style={[styles.sphereCard, { backgroundColor: colors.surface2 }]}>
            <View style={styles.sphereHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sphereTitle, { color: colors.ink }]}>Skill universe</Text>
                <Text style={[styles.sphereSub, { color: colors.muted }]}>
                  {(skills ?? []).length} skills · drag to spin, tap to filter
                </Text>
              </View>
              {filterName ? (
                <Pressable
                  onPress={() => setSkillFilter(null)}
                  style={[styles.filterPill, { backgroundColor: colors.ink }]}
                  accessibilityLabel={`Clear ${filterName} filter`}
                >
                  <Text style={[styles.filterPillText, { color: colors.bg }]} numberOfLines={1}>
                    {filterName}
                  </Text>
                  <Icon name="close" size={10} color={colors.bg} weight="bold" />
                </Pressable>
              ) : null}
            </View>
            <SphereImageGrid
              images={exploreSphereImages}
              containerSize={280}
              sphereRadius={110}
              dragSensitivity={0.75}
              baseImageScale={0.15}
              autoRotate
              autoRotateSpeed={0.22}
              selectedSkillId={skillFilter}
              showLabels
            />
          </View>
        </View>
      ) : null}

      {(popular ?? []).length > 0 ? (
        <View style={styles.section}>
          <View style={styles.pad}>
            <SectionHeader title={filterName ? `${filterName} posts` : 'Fresh practice'} subtitle="What the community is logging" />
          </View>
          <View style={styles.masonry}>
            {columns.cols.map((col, ci) => (
              <View key={ci} style={styles.masonryCol}>
                {col!.map((tile, ti) => (
                  <Pressable
                    key={tile.id}
                    onPress={() => router.push({ pathname: '/post/[id]', params: { id: tile.id, kind: 'session' } })}
                    accessibilityLabel={`${tile.authorName}, ${formatDuration(tile.minutes * 60)} of ${tile.skillLower}`}
                    style={({ pressed }) => pressed && { opacity: 0.88 }}
                  >
                    <View style={styles.tile}>
                      <Art
                        seed={tile.id}
                        color={tile.skillColor}
                        letter={tile.skillName}
                        quality={Math.min(0.95, 0.3 + tile.kudos / 20)}
                        aspectRatio={columns.ratios[(ci + ti) % 3]}
                      />
                      <Scrim extent={0.5} />
                      <View style={styles.tileCap}>
                        <Text style={styles.tileAuthor} numberOfLines={1}>
                          {tile.authorName}
                        </Text>
                        <Text style={styles.tileMeta} numberOfLines={1}>
                          {formatDuration(tile.minutes * 60)} of {tile.skillLower}
                        </Text>
                      </View>
                      {tile.kudos > 0 ? (
                        <View style={styles.tileKudos}>
                          <Icon name="heart" filled size={11} color="#FFFFFF" />
                          <Text style={styles.tileKudosText}>{tile.kudos}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>
      ) : (
        <EmptyState
          icon={query ? 'search' : 'people'}
          title={query ? 'No matching sessions' : 'Be the first here'}
          body={
            query
              ? `Nothing matches “${query}”. Try a skill name or a person.`
              : 'No one else is learning this yet. You’re a founding Larper — invite people to grow this skill’s community.'
          }
        />
      )}
      <View style={{ height: 28 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: GUTTER },
  searchWrap: { paddingHorizontal: GUTTER, paddingBottom: 6 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15.5, letterSpacing: -0.15, paddingVertical: 0, height: '100%' },
  clear: { width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 6, paddingHorizontal: GUTTER, paddingTop: 6, paddingBottom: 14 },
  section: { marginTop: 6, marginBottom: 10, gap: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: GUTTER, paddingVertical: 8 },
  userName: { fontFamily: fonts.bodyBold, fontSize: 15, letterSpacing: -0.2 },
  userSub: { fontFamily: fonts.body, fontSize: 13.5, marginTop: 1 },
  sphereCard: { borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, alignItems: 'center', overflow: 'hidden', marginBottom: 16 },
  sphereHead: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  sphereTitle: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.35 },
  sphereSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, borderRadius: 999, paddingHorizontal: 11, maxWidth: 150 },
  filterPillText: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  masonry: { flexDirection: 'row', gap: 4, paddingHorizontal: 4 },
  masonryCol: { flex: 1, gap: 4 },
  tile: { borderRadius: 10, overflow: 'hidden' },
  tileCap: { position: 'absolute', left: 10, right: 10, bottom: 9 },
  tileAuthor: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 13.5, letterSpacing: -0.15 },
  tileMeta: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.body, fontSize: 12, marginTop: 1 },
  tileKudos: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 22,
  },
  tileKudosText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 11.5 },
});
