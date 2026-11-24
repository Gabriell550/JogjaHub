import React, { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../constants/theme';

type Props = { urls: string[]; style?: StyleProp<ViewStyle> };

export default function CustomerPhoto({ urls, style }: Props) {
  return <Photo key={JSON.stringify(urls)} urls={urls} style={style} />;
}

function Photo({ urls, style }: Props) {
  const [index, setIndex] = useState(0);
  const uri = urls[index];
  return (
    <View style={[styles.frame, style]}>
      {uri ? <Image key={uri} source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover"
        accessible={false} onError={() => setIndex(current => current === index ? current + 1 : current)} />
        : <Ionicons name="image-outline" size={24} color={colors.primary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryFixed },
});
