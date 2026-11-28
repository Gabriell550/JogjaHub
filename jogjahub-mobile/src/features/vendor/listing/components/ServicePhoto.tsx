import React, { useEffect, useState } from 'react';
import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { ImageOff } from 'lucide-react-native';

type Props = {
  uri: string | null;
  fallbackUri?: string | null;
  style: StyleProp<ImageStyle>;
  placeholderStyle: StyleProp<ViewStyle>;
  iconSize?: number;
  iconColor?: string;
};

export function ServicePhoto({ uri, fallbackUri, style, placeholderStyle, iconSize = 28, iconColor }: Props) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setFailedUri(null);
    setFallbackFailed(false);
  }, [uri, fallbackUri]);

  const usingFallback = !uri || failedUri === uri;
  const source = usingFallback ? (fallbackFailed ? null : fallbackUri) : uri;

  if (!source) {
    return (
      <View style={placeholderStyle}>
        <ImageOff size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: source }}
      style={style}
      onError={(event) => {
        if (usingFallback) setFallbackFailed(true);
        else setFailedUri(source);
        if (usingFallback || !fallbackUri) {
          console.warn('Foto layanan gagal dimuat:', source, event.nativeEvent.error);
        }
      }}
    />
  );
}
