import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { fonts, useTheme } from '@/src/theme';
import type { SkillTree, TreeNode } from '@/src/types/app';

/**
 * The game-style skill tree: a trunk and up to three coloured strands rising
 * and splitting into curved, glowing branches on a card-coloured canvas.
 * Layout is ported from the prototype (fixed 400-wide coordinate space,
 * scaled to the device width by the Svg viewBox).
 */

export const BRANCH_COLORS = ['#5B3DF5', '#0EA5E9', '#F97316'];

export type TreePalette = {
  bg: string;
  lockedFill: string;
  lockedStroke: string;
  lockedGlyph: string;
  dimPath: string;
  label: string;
  labelLocked: string;
  footer: string;
};

export function useTreePalette(): TreePalette {
  const { colors, isDark } = useTheme();
  return {
    bg: isDark ? colors.surface : colors.surface2,
    lockedFill: isDark ? colors.surface2 : colors.surface,
    lockedStroke: colors.surface3,
    lockedGlyph: colors.subtle,
    dimPath: colors.surface3,
    label: colors.ink,
    labelLocked: colors.subtle,
    footer: colors.muted,
  };
}

const POSITIONS: [number, number][][] = [
  [[132, 418], [92, 330], [64, 240], [48, 148]],
  [[200, 400], [212, 306], [190, 212], [200, 118]],
  [[268, 418], [308, 330], [336, 240], [352, 148]],
];
const FOOTER_X = [70, 200, 330];

function branchSlots(count: number): number[] {
  if (count === 1) return [1];
  if (count === 2) return [0, 2];
  return [0, 1, 2];
}

function nodePoints(slot: number, count: number): [number, number][] {
  const P = POSITIONS[slot]!;
  if (count >= 4) return P.slice(0, 4);
  if (count === 3) return [P[0]!, [(P[1]![0] + P[2]![0]) / 2, (P[1]![1] + P[2]![1]) / 2], P[3]!];
  return P.slice(0, Math.max(1, count));
}

const seg = (a: [number, number], b: [number, number]) =>
  `M${a[0]} ${a[1]} C${a[0]} ${a[1] - 45} ${b[0]} ${b[1] + 45} ${b[0]} ${b[1]}`;

/** Clockwise arc from 12 o'clock covering `fraction` of the circle. */
function arc(x: number, y: number, r: number, fraction: number): string {
  const f = Math.min(0.9999, Math.max(0, fraction));
  const angle = f * 2 * Math.PI - Math.PI / 2;
  const ex = x + r * Math.cos(angle);
  const ey = y + r * Math.sin(angle);
  return `M${x} ${y - r} A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

function wrapLabel(text: string, max = 13): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function BranchPath({ d, color, state, palette }: { d: string; color: string; state: 'lit' | 'next' | 'dim'; palette: TreePalette }) {
  if (state === 'lit') {
    return (
      <G>
        {/* glow underlay (react-native-svg has no blur filter — fake it) */}
        <Path d={d} stroke={color} strokeWidth={11} fill="none" opacity={0.16} strokeLinecap="round" />
        <Path d={d} stroke={color} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (state === 'next') {
    return <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeDasharray="5 6" strokeLinecap="round" opacity={0.65} />;
  }
  return <Path d={d} stroke={palette.dimPath} strokeWidth={3} fill="none" strokeLinecap="round" />;
}

function TreeNodeGlyph({
  node,
  x,
  y,
  color,
  palette,
  onPress,
}: {
  node: TreeNode;
  x: number;
  y: number;
  color: string;
  palette: TreePalette;
  onPress: () => void;
}) {
  const r = node.isMilestone ? 25 : 19;
  const state = node.state;
  const labelY = y + r + (state === 'landed' || state === 'locked' ? 18 : 28);
  const lines = wrapLabel(node.name);
  return (
    <G onPress={onPress}>
      {/* generous tap target */}
      <Circle cx={x} cy={y} r={r + 14} fill="transparent" />
      {state === 'landed' ? (
        <G>
          <Circle cx={x} cy={y} r={r + 7} fill={color} opacity={0.14} />
          <Circle cx={x} cy={y} r={r} fill={color} />
          <Path
            d={`M${x - 7} ${y} l5 5 l9 -10`}
            stroke="#FFFFFF"
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      ) : state === 'locked' ? (
        <G>
          <Circle cx={x} cy={y} r={r} fill={palette.lockedFill} stroke={palette.lockedStroke} strokeWidth={1.5} />
          <Rect x={x - 6} y={y - 2} width={12} height={10} rx={2.5} fill={palette.lockedGlyph} />
          <Path d={`M${x - 4} ${y - 2} v-3 a4 4 0 0 1 8 0 v3`} stroke={palette.lockedGlyph} strokeWidth={2} fill="none" />
        </G>
      ) : (
        <G>
          <Circle
            cx={x}
            cy={y}
            r={r}
            fill={palette.bg}
            stroke={color}
            strokeWidth={state === 'in_progress' ? 2.5 : 2}
            strokeDasharray={state === 'available' ? '4 3' : undefined}
          />
          {node.sessionsLogged > 0 ? (
            node.sessionsLogged >= node.sessionsToLand ? (
              <Circle cx={x} cy={y} r={r + 5} fill="none" stroke={color} strokeWidth={3} />
            ) : (
              <Path
                d={arc(x, y, r + 5, node.sessionsLogged / node.sessionsToLand)}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
            )
          ) : null}
          <SvgText x={x} y={y + 5} textAnchor="middle" fontFamily={fonts.bold} fontWeight="700" fontSize={r > 20 ? 17 : 14} fill={color}>
            {node.position + 1}
          </SvgText>
          <Rect x={x - 15} y={y + r - 4} width={30} height={16} rx={8} fill={palette.bg} stroke={color} strokeWidth={1.25} />
          <SvgText x={x} y={y + r + 8} textAnchor="middle" fontFamily={fonts.bold} fontSize={9.5} fontWeight="700" fill={color}>
            {node.sessionsLogged}/{node.sessionsToLand}
          </SvgText>
        </G>
      )}
      {/* halo pass, then the label itself on top so web doesn't paint the stroke over the fill */}
      {lines.map((line, i) => (
        <SvgText
          key={`h${i}`}
          x={x}
          y={labelY + i * 13}
          textAnchor="middle"
          fontFamily={fonts.bodyBold}
          fontSize={11}
          fill={palette.bg}
          stroke={palette.bg}
          strokeWidth={4}
          strokeLinejoin="round"
        >
          {line}
        </SvgText>
      ))}
      {lines.map((line, i) => (
        <SvgText
          key={`t${i}`}
          x={x}
          y={labelY + i * 13}
          textAnchor="middle"
          fontFamily={fonts.bodyBold}
          fontSize={11}
          fill={state === 'locked' ? palette.labelLocked : palette.label}
        >
          {line}
        </SvgText>
      ))}
    </G>
  );
}

type TreeSvgProps = {
  tree: SkillTree;
  onNodePress: (node: TreeNode) => void;
};

export function TreeSvg({ tree, onNodePress }: TreeSvgProps) {
  const palette = useTreePalette();
  const slots = branchSlots(tree.branches.length);

  return (
    <View style={styles.wrap}>
      <Svg viewBox="0 88 400 542" width="100%">
        {tree.branches.map((branch, bi) => {
          const slot = slots[bi]!;
          const color = BRANCH_COLORS[slot]!;
          const pts = nodePoints(slot, branch.nodes.length);
          const sx = 192 + slot * 8;
          const landed = branch.nodes.filter((n) => n.state === 'landed').length;

          return (
            <G key={branch.id}>
              {/* trunk */}
              <Path d={`M${sx} 560 L${sx} 470`} stroke={color} strokeWidth={4.5} strokeLinecap="round" opacity={0.9} />
              {/* first connection: lit if first node landed, else dashed */}
              {pts.length > 0 ? (
                <BranchPath
                  d={seg([sx, 470], pts[0]!)}
                  color={color}
                  palette={palette}
                  state={branch.nodes[0]?.state === 'landed' ? 'lit' : 'next'}
                />
              ) : null}
              {branch.nodes.slice(1).map((node, i) => (
                <BranchPath
                  key={node.id}
                  d={seg(pts[i]!, pts[i + 1]!)}
                  color={color}
                  palette={palette}
                  state={node.state === 'landed' ? 'lit' : node.state === 'locked' ? 'dim' : 'next'}
                />
              ))}
              {branch.nodes.map((node, i) => (
                <TreeNodeGlyph
                  key={node.id}
                  node={node}
                  x={Math.round(pts[i]![0])}
                  y={Math.round(pts[i]![1])}
                  color={color}
                  palette={palette}
                  onPress={() => onNodePress(node)}
                />
              ))}
              <SvgText x={FOOTER_X[slot]} y={590} textAnchor="middle" fontFamily={fonts.bodyBold} fontSize={12} fill={palette.footer}>
                {branch.name}
              </SvgText>
              <SvgText x={FOOTER_X[slot]} y={616} textAnchor="middle" fontFamily={fonts.numHeavy} fontSize={26} fontWeight="800" fill={color}>
                {landed}/{branch.nodes.length}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      {/* invisible Pressable fallback so the SVG itself never eats taps on web */}
      <Pressable style={StyleSheet.absoluteFill} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});
