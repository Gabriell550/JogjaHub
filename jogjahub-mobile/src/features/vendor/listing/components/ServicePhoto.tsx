import React, { useEffect, useState } from 'react';
import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { ImageOff } from 'lucide-react-native';

type Props = {
  uri: string | null;
  style: StyleProp<ImageStyle>;
  placeholderStyle: StyleProp<ViewStyle>;
  iconSize?: number;
  iconColor?: string;
};

export function ServicePhoto({ uri, style, placeholderStyle, iconSize = 28, iconColor }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View style={placeholderStyle}>
        <ImageOff size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={(event) => {
        console.warn('Foto layanan gagal dimuat:', uri, event.nativeEvent.error);
        setFailed(true);
      }}
    />
  );
}
