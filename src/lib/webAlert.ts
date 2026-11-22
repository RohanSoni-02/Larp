import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * react-native-web ships `Alert.alert` as a no-op, so every error and confirm
 * dialog in the app would silently vanish in the browser. Route them through
 * the browser's own dialogs instead. Two-or-more buttons become a confirm():
 * OK runs the first non-cancel button, Cancel runs the cancel button.
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }
    const cancel = buttons.find((b) => b.style === 'cancel');
    const action = buttons.find((b) => b.style !== 'cancel');
    if (window.confirm(text)) action?.onPress?.();
    else cancel?.onPress?.();
  };
}
