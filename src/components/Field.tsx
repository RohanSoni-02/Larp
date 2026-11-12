import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { fonts, useTheme } from '@/src/theme';

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

/** Labelled text input with an accessible label and focus ring. */
export function Field({ label, hint, onFocus, onBlur, style, ...inputProps }: FieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: focused ? colors.ink : colors.muted }]} nativeID={`label-${label}`}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.subtle}
        selectionColor={colors.accent}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          inputProps.multiline && styles.multiline,
          {
            backgroundColor: focused ? colors.surface : colors.surface2,
            borderColor: focused ? colors.accent : colors.surface2,
            color: colors.ink,
          },
          style,
        ]}
        {...inputProps}
      />
      {hint ? <Text style={[styles.hint, { color: colors.subtle }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, marginBottom: 7, letterSpacing: -0.05 },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 52,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  hint: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 6 },
});
