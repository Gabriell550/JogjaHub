import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { X, LocateFixed } from 'lucide-react-native';
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

// Halaman peta (Leaflet + OpenStreetMap). Pin ada di HTML, tepat di tengah peta; setiap kali peta
// berhenti digeser, titik tengahnya dikirim ke React Native lewat postMessage.
function buildMapHtml(start: Coordinate): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  #pin { position: absolute; left: 50%; top: 50%; width: 32px; height: 40px;
         margin-left: -16px; margin-top: -40px; z-index: 1000; pointer-events: none; }
</style>
</head>
<body>
<div id="map"></div>
<div id="pin">
  <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="#FF6B00"/>
    <circle cx="16" cy="16" r="6" fill="#ffffff"/>
  </svg>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  function send(type, payload) {
    window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, payload)));
  }
  var map = L.map('map').setView([${start.latitude}, ${start.longitude}], 16);
  var tileErrorSent = false;
  var layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  layer.on('tileerror', function () {
    if (!tileErrorSent) { tileErrorSent = true; send('tileError', {}); }
  });
  map.on('moveend', function () {
    var c = map.getCenter();
    send('center', { latitude: c.lat, longitude: c.lng });
  });
  send('ready', {});
</script>
</body>
</html>`;
}

export function MapPickerModal({ visible, initialCoordinate, onClose, onConfirm }: Props) {
  // Modal tidak merender isinya saat visible=false, jadi MapPickerContent dibuat ulang tiap dibuka
  // dan selalu mulai dari initialCoordinate terbaru.
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <MapPickerContent initialCoordinate={initialCoordinate} onClose={onClose} onConfirm={onConfirm} />
    </Modal>
  );
}

type ContentProps = Omit<Props, 'visible'>;

function MapPickerContent({ initialCoordinate, onClose, onConfirm }: ContentProps) {
  const webViewRef = useRef<WebView>(null);
  const [html] = useState(() => buildMapHtml(initialCoordinate ?? DEFAULT_COORDINATE));
  const [coordinate, setCoordinate] = useState<Coordinate>(initialCoordinate ?? DEFAULT_COORDINATE);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  // Kalau peta belum siap setelah 10 detik, kemungkinan besar tidak ada internet.
  useEffect(() => {
    if (mapReady) return;
    const timer = setTimeout(() => {
      setMessage('Peta belum termuat. Pastikan HP terhubung ke internet, lalu tutup dan buka lagi.');
    }, 10000);
    return () => clearTimeout(timer);
  }, [mapReady]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setMapReady(true);
        setMessage('');
      } else if (data.type === 'center') {
        setCoordinate({ latitude: data.latitude, longitude: data.longitude });
      } else if (data.type === 'tileError') {
        setMessage('Sebagian gambar peta gagal dimuat. Periksa koneksi internet Anda.');
      }
    } catch (err) {
      console.log('Pesan peta tidak valid:', err);
    }
  };

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
      const { latitude, longitude } = position.coords;
      webViewRef.current?.injectJavaScript(`map.setView([${latitude}, ${longitude}], 17); true;`);
      setCoordinate({ latitude, longitude });
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
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Pilih Titik Lokasi</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <X size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.mapWrap}>
        <WebView
          ref={webViewRef}
          style={styles.webview}
          originWhitelist={['*']}
          // baseUrl dipakai supaya permintaan tile membawa Referer (OpenStreetMap memblokir tanpa Referer).
          source={{ html, baseUrl: 'https://jogjahub.app' }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          onMessage={handleMessage}
          onError={() => setMessage('Peta gagal dimuat. Periksa koneksi internet lalu buka lagi.')}
          onHttpError={() => setMessage('Peta gagal dimuat. Periksa koneksi internet lalu buka lagi.')}
        />
        {!mapReady ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primaryContainer} />
          </View>
        ) : null}
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
          disabled={locating || !mapReady}
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

        <Button label="Konfirmasi Lokasi" onPress={handleConfirm} disabled={!mapReady} />
      </View>
    </View>
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
  webview: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
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
