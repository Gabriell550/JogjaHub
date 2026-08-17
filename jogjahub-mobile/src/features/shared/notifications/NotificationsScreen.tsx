import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, Calendar, CheckCircle2, Clock, AlertCircle, ChevronRight, CheckCheck } from 'lucide-react-native';
import { useNotificationStore } from './store/NotificationStore';
import { useSelector } from 'react-redux';
import type { RootState } from '@store/index';
import { NotificationItem, NotificationType } from '@services/notificationService';
const TYPE_CONFIG: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  booking: { icon: Calendar, color: '#4F46E5', bg: '#EEF2FF' },
  approval: { icon: CheckCircle2, color: '#059669', bg: '#ECFDF5' },
  reminder: { icon: Clock, color: '#D97706', bg: '#FFFBEB' },
};

const POLL_INTERVAL_MS = 30000;

export default function NotificationsScreen() {
  const rawRole = useSelector((state: RootState) => state.auth.user?.role);
  const role = (rawRole === 'vendor' ? 'tenant' : rawRole) as 'customer' | 'tenant' | 'admin' | undefined;
  const { items, isLoading, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    if (role) fetchNotifications(role);
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      load();
      pollRef.current = setInterval(load, POLL_INTERVAL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
  );

  const unreadCount = items.filter((n) => !n.is_read).length;

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.booking;
    const Icon = config.icon;

    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        onPress={() => role && markRead(role, item.id)}
        activeOpacity={0.7}
      >
        {!item.is_read && <View style={styles.unreadDot} />}

        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Icon size={20} color={config.color} />
        </View>

        <View style={styles.content}>
          <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
          <Text style={[styles.title, !item.is_read && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <ChevronRight size={20} color="#94A3B8" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Bell size={22} color="#4F46E5" />
          <Text style={styles.headerTitle}>Notifikasi</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} Baru</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          Informasi booking masuk, status approval, dan pengingat jadwal Anda.
        </Text>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <CheckCheck size={16} color="#4F46E5" />
            <Text style={styles.markAllText}>Tandai semua dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Bell size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>Tidak ada notifikasi saat ini</Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />
          )
        }
      />
    </View>
  );
}

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit yang lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Kemarin';
  return `${days} hari yang lalu`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  badge: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginLeft: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#4338CA' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' },
  markAllText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },

  listContent: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardUnread: { borderColor: '#C7D2FE', shadowColor: '#4F46E5', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  unreadDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  iconWrap: { padding: 10, borderRadius: 12 },
  content: { flex: 1 },
  time: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  title: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  titleUnread: { color: '#0F172A' },
  description: { fontSize: 13, color: '#64748B', marginTop: 2, lineHeight: 18 },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { color: '#64748B', fontWeight: '500' },
});