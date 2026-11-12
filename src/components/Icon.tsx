import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Platform, type ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';

import { useTheme } from '@/src/theme';

type IonName = keyof typeof Ionicons.glyphMap;
type McName = keyof typeof MaterialCommunityIcons.glyphMap;
type IconDef = { sf?: SFSymbol; sfOn?: SFSymbol; ion?: IonName; ionOn?: IonName; mc?: McName; mcOn?: McName };

/**
 * Cross-platform icon set: SF Symbols on iOS, Ionicons elsewhere (Material
 * Community for glyphs Ionicons lacks). `filled` picks the solid variant.
 */
const ICONS = {
  home: { sf: 'house', sfOn: 'house.fill', ion: 'home-outline', ionOn: 'home' },
  explore: { sf: 'safari', sfOn: 'safari.fill', ion: 'compass-outline', ionOn: 'compass' },
  search: { sf: 'magnifyingglass', ion: 'search' },
  trees: { sf: 'leaf', sfOn: 'leaf.fill', ion: 'leaf-outline', ionOn: 'leaf' },
  profile: { sf: 'person.crop.circle', sfOn: 'person.crop.circle.fill', ion: 'person-circle-outline', ionOn: 'person-circle' },
  arena: { sf: 'trophy', sfOn: 'trophy.fill', ion: 'trophy-outline', ionOn: 'trophy' },
  play: { sf: 'play.fill', ion: 'play' },
  pause: { sf: 'pause.fill', ion: 'pause' },
  plus: { sf: 'plus', ion: 'add' },
  minus: { sf: 'minus', ion: 'remove' },
  bell: { sf: 'bell', sfOn: 'bell.fill', ion: 'notifications-outline', ionOn: 'notifications' },
  heart: { sf: 'heart', sfOn: 'heart.fill', ion: 'heart-outline', ionOn: 'heart' },
  comment: { sf: 'bubble.right', ion: 'chatbubble-outline' },
  share: { sf: 'paperplane', ion: 'paper-plane-outline' },
  'share-up': { sf: 'square.and.arrow.up', ion: 'share-outline' },
  bookmark: { sf: 'bookmark', sfOn: 'bookmark.fill', ion: 'bookmark-outline', ionOn: 'bookmark' },
  close: { sf: 'xmark', ion: 'close' },
  back: { sf: 'chevron.left', ion: 'chevron-back' },
  'chevron-right': { sf: 'chevron.right', ion: 'chevron-forward' },
  'chevron-down': { sf: 'chevron.down', ion: 'chevron-down' },
  'arrow-right': { sf: 'arrow.right', ion: 'arrow-forward' },
  flame: { sf: 'flame', sfOn: 'flame.fill', ion: 'flame-outline', ionOn: 'flame' },
  shield: { sf: 'shield', sfOn: 'shield.fill', ion: 'shield-outline', ionOn: 'shield' },
  check: { sf: 'checkmark', ion: 'checkmark' },
  'check-circle': { sf: 'checkmark.circle', sfOn: 'checkmark.circle.fill', ion: 'checkmark-circle-outline', ionOn: 'checkmark-circle' },
  verified: { sf: 'checkmark.seal.fill', ion: 'shield-checkmark' },
  camera: { sf: 'camera', sfOn: 'camera.fill', ion: 'camera-outline', ionOn: 'camera' },
  photo: { sf: 'photo.on.rectangle', ion: 'images-outline' },
  video: { sf: 'video', sfOn: 'video.fill', ion: 'videocam-outline', ionOn: 'videocam' },
  clock: { sf: 'clock', ion: 'time-outline' },
  timer: { sf: 'timer', ion: 'timer-outline' },
  calendar: { sf: 'calendar', ion: 'calendar-outline' },
  location: { sf: 'mappin.and.ellipse', ion: 'location-outline' },
  people: { sf: 'person.2', sfOn: 'person.2.fill', ion: 'people-outline', ionOn: 'people' },
  'person-add': { sf: 'person.badge.plus', ion: 'person-add-outline' },
  bolt: { sf: 'bolt', sfOn: 'bolt.fill', ion: 'flash-outline', ionOn: 'flash' },
  medal: { sf: 'rosette', ion: 'ribbon-outline', ionOn: 'ribbon' },
  podium: { sf: 'list.number', ion: 'podium-outline', ionOn: 'podium' },
  mentor: { sf: 'graduationcap', sfOn: 'graduationcap.fill', ion: 'school-outline', ionOn: 'school' },
  ticket: { sf: 'ticket', ion: 'ticket-outline' },
  headphones: { sf: 'headphones', ion: 'headset-outline' },
  moon: { sf: 'moon', sfOn: 'moon.fill', ion: 'moon-outline', ionOn: 'moon' },
  sunrise: { sf: 'sunrise', ion: 'partly-sunny-outline' },
  sun: { sf: 'sun.max', ion: 'sunny-outline' },
  cup: { sf: 'cup.and.saucer', ion: 'cafe-outline' },
  lock: { sf: 'lock.fill', ion: 'lock-closed' },
  trash: { sf: 'trash', ion: 'trash-outline' },
  edit: { sf: 'pencil', ion: 'pencil' },
  logout: { sf: 'rectangle.portrait.and.arrow.right', ion: 'log-out-outline' },
  grid: { sf: 'square.grid.3x3', sfOn: 'square.grid.3x3.fill', ion: 'grid-outline', ionOn: 'grid' },
  compare: { sf: 'square.split.2x1', sfOn: 'square.split.2x1.fill', ion: 'git-compare-outline', ionOn: 'git-compare' },
  more: { sf: 'ellipsis', ion: 'ellipsis-horizontal' },
  menu: { sf: 'line.3.horizontal', ion: 'menu-outline' },
  settings: { sf: 'gearshape', ion: 'settings-outline' },
  apple: { sf: 'apple.logo', ion: 'logo-apple' },
  google: { ion: 'logo-google' },
  mail: { sf: 'envelope', ion: 'mail-outline' },
  flag: { sf: 'flag', ion: 'flag-outline' },
  trending: { sf: 'chart.line.uptrend.xyaxis', ion: 'trending-up' },
  eye: { sf: 'eye', ion: 'eye-outline' },
  inbox: { sf: 'tray', ion: 'file-tray-outline' },
  send: { sf: 'arrow.up', ion: 'arrow-up' },
  layers: { sf: 'square.stack.3d.up', ion: 'layers-outline' },
  'frame-back': { sf: 'backward.frame.fill', ion: 'play-skip-back' },
  'frame-forward': { sf: 'forward.frame.fill', ion: 'play-skip-forward' },
  info: { sf: 'info.circle', ion: 'information-circle-outline' },
  globe: { sf: 'globe', ion: 'globe-outline' },
  sparkles: { sf: 'sparkles', ion: 'sparkles-outline' },
  clap: { sf: 'hands.clap', sfOn: 'hands.clap.fill', mc: 'hand-clap', mcOn: 'hand-clap' },
} as const satisfies Record<string, IconDef>;

export type AppIconName = keyof typeof ICONS;

type IconProps = {
  name: AppIconName;
  size?: number;
  color?: ColorValue;
  /** Solid variant (active tab, liked heart, saved bookmark…). */
  filled?: boolean;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

export function Icon({ name, size = 24, color, filled = false, weight = 'regular' }: IconProps) {
  const { colors } = useTheme();
  const tint = (color ?? colors.ink) as string;
  const def: IconDef = ICONS[name];
  if (Platform.OS === 'ios' && def.sf) {
    return (
      <SymbolView
        name={(filled && def.sfOn) || def.sf}
        tintColor={tint}
        size={size}
        weight={weight}
        resizeMode="scaleAspectFit"
      />
    );
  }
  if (def.mc) {
    return <MaterialCommunityIcons name={(filled && def.mcOn) || def.mc} size={size} color={tint} />;
  }
  return <Ionicons name={(filled && def.ionOn) || def.ion || 'ellipse-outline'} size={size} color={tint} />;
}
