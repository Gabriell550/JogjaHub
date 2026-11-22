import React, { useState, type ComponentProps, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../../constants/theme';
import { tenantLayout } from '../../../constants/theme/tenant';

type Props = ComponentProps<typeof Pressable> & {
  ref?: Ref<ComponentRef<typeof Pressable>>;
  onDark?: boolean;
  focusRadius?: number;
};

export function TenantPressable({
  children, style, onFocus, onBlur, disabled, focusable, onDark, focusRadius = radius.md, ...props
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      {...props}
      disabled={disabled}
      focusable={disabled ? false : focusable}
      onFocus={event => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={event => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={state => [
        styles.target,
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && styles.pressed,
      ]}
    >
      {state => (
        <>
          {typeof children === 'function' ? children(state) : children}
          {focused && !disabled && (
            <View
              pointerEvents="none"
              aria-hidden
              style={[styles.outline, {
                borderRadius: focusRadius,
                borderColor: onDark ? colors.onNavy : colors.tertiary,
              }]}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { minWidth: tenantLayout.minTarget, minHeight: tenantLayout.minTarget, justifyContent: 'center' },
  pressed: { opacity: 0.82 },
  outline: { position: 'absolute', inset: 2, borderWidth: 2 },
});
