import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapPin, X, LocateFixed } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { Button } from '../../../components/Button/Button';

export type Coordinate = { latitude: number; longitude: number };

type Props = {
  visible: boolean;
  initialCoordinate: Coordinate | null;
  onClose: () => void;
  onConfirm: (coordinate: Coordinate) => void;
};

// Pusat kota Yogyakarta, dipakai kalau belum ada titik yang dipilih.
const DEFAULT_COORDINATE: Coordinate = { latitude: -7.7956, longitude: 110.3695 };
const DEFAULT_DELTA = 0.02;
const PIN_SIZE = 40;

export function MapPickerModal({ visible, initialCoordinate, onClose, onConfirm }: Props) {
  const mapRef = useRef<MapView>(null);
  const [coordinate, setCoordinate] = useState<Coordinate>(initialCoordinate ?? DEFAULT_COORDINATE);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setCoordinate(initialCoordinate ?? DEFAULT_COORDINATE);
      setMessage('');
    }
  }, [visible, initialCoordinate]);

  const start = initialCoordinate ?? DEFAULT_COORDINATE;

  const handleUseMyLocation = async () => {
    setLocating(true);
    setMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Izin lokasi ditolak. Geser peta secara manual untuk memilih titik.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const target = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      mapRef.current?.animateToRegion({ ...target, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500);
      setCoordinate(target);
    } catch (err) {
      console.log('Gagal mengambil lokasi:', err);
      setMessage('Gagal mengambil lokasi. Pastikan GPS aktif, atau geser peta secara manual.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: Number(coordinate.latitude.toFixed(6)),
      longitude: Number(coordinate.longitude.toFixed(6)),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Titik Lokasi</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={24} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{ ...start, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA }}
            onRegionChangeComplete={(region: Region) =>
              setCoordinate({ latitude: region.latitude, longitude: region.longitude })
            }
          />
          {/* Pin tetap di tengah; ujung bawah ikon tepat di titik tengah peta. */}
          <View pointerEvents="none" style={styles.pin}>
            <MapPin size={PIN_SIZE} color={colors.primaryContainer} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.coordinateText}>
            {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
          </Text>
          <Text style={styles.helper}>Geser peta sampai pin tepat di lokasi usaha Anda.</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.locateBtn, pressed && styles.locateBtnPressed]}
            onPress={handleUseMyLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator color={colors.primaryContainer} />
            ) : (
              <>
                <LocateFixed size={18} color={colors.primaryContainer} />
                <Text style={styles.locateText}>Gunakan Lokasi Saya</Text>
              </>
            )}
          </Pressable>

          <Button label="Konfirmasi Lokasi" onPress={handleConfirm} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 56,
    paddingBottom: spacing.stackLg,
  },
  title: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: typography.headlineSm.fontSize,
    fontWeight: '700',
    color: colors.onSurface,
  },
  mapWrap: { flex: 1 },
  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -PIN_SIZE / 2,
    marginTop: -PIN_SIZE,
  },
  footer: {
    padding: spacing.containerMargin,
    gap: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  coordinateText: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: typography.labelLg.fontSize,
    color: colors.onSurface,
  },
  helper: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
    color: colors.onSurfaceVariant,
  },
  message: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
    color: colors.error,
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    borderRadius: radius.DEFAULT,
  },
  locateBtnPressed: { backgroundColor: colors.surfaceContainerLow },
  locateText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: colors.primaryContainer,
  },
});
