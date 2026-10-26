import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, MoreVertical, CheckCheck, Check, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography } from '../../../../constants/theme';

type ChatConversation = {
  id: string;
  customerName: string;
  avatar: string;
  serviceName: string;
  bookingInfo?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  category: 'unread' | 'scheduled' | 'today' | 'done';
  verified?: boolean;
};

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-1',
    customerName: 'Annisa Dwi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
    serviceName: 'Hairy Gloss Spa',
    bookingInfo: '✓ Terjadwal Otomatis (24 Mei, 14:00)',
    lastMessage: 'Slot jam 14:00 sudah otomatis masuk kalender ya kak, sampai jumpa nanti!',
    time: '14:05',
    unreadCount: 1,
    isOnline: true,
    category: 'unread',
    verified: true,
  },
  {
    id: 'conv-2',
    customerName: 'Rangga Pratama',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    serviceName: 'Mantaps Haircut & Wash',
    bookingInfo: '✓ Terjadwal Otomatis (24 Mei, 16:30)',
    lastMessage: 'Kak, slot jam 16:30 saya sudah fix. Nanti minta model taper fade ya...',
    time: '13:48',
    unreadCount: 2,
    isOnline: false,
    category: 'unread',
    verified: false,
  },
  {
    id: 'conv-3',
    customerName: 'Siti Rahmawati',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
    serviceName: 'Hair Spa Treatment',
    lastMessage: 'Terima kasih banyak kak, rambutnya wangi dan rapi banget! Bintang 5 ya ⭐⭐⭐⭐⭐',
    time: 'Kemarin',
    unreadCount: 0,
    isOnline: false,
    category: 'done',
    verified: false,
  },
  {
    id: 'conv-4',
    customerName: 'Dimas Anggara',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    serviceName: 'Tanya Promo',
    lastMessage: 'Apakah promo diskon JogjaHub masih berlaku untuk booking akhir pekan ini?',
    time: '22 Mei',
    unreadCount: 0,
    isOnline: false,
    category: 'scheduled',
    verified: false,
  },
  {
    id: 'conv-5',
    customerName: 'Clara Novita',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    serviceName: 'Creambath Tradisional',
    bookingInfo: '✓ Terjadwal Otomatis',
    lastMessage: 'Halo kak, untuk creambath besok saya pilih aroma lidah buaya ya.',
    time: '21 Mei',
    unreadCount: 0,
    isOnline: true,
    category: 'today',
    verified: false,
  },
];

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'scheduled', label: 'Terjadwal' },
  { key: 'today', label: 'Hari Ini' },
  { key: 'done', label: 'Selesai' },
];

export default function VendorChatInboxScreen() {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@jogjahub_vendor_chats');
        if (stored) {
          setConversations(JSON.parse(stored));
        }
      } catch {}
    })();
  }, []);

  const totalUnread = useMemo(
    () => conversations.reduce((acc, curr) => acc + (curr.unreadCount > 0 ? 1 : 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      const matchSearch =
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serviceName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'unread') return item.unreadCount > 0;
      if (activeTab === 'scheduled') return item.category === 'scheduled' || !!item.bookingInfo;
      if (activeTab === 'today') return item.category === 'today' || item.time.includes(':');
      if (activeTab === 'done') return item.category === 'done';

      return true;
    });
  }, [conversations, searchQuery, activeTab]);

  const handleOpenRoom = (item: ChatConversation) => {
    // Kurangi notifikasi unread lokal
    const updated = conversations.map((c) => (c.id === item.id ? { ...c, unreadCount: 0 } : c));
    setConversations(updated);
    AsyncStorage.setItem('@jogjahub_vendor_chats', JSON.stringify(updated)).catch(() => {});

    navigation.navigate('VendorChatRoom', {
      conversationId: item.id,
      customerName: item.customerName,
      customerAvatar: item.avatar,
      serviceName: item.serviceName,
      servicePrice: 145000,
      bookingTime: 'Besok, 24 Mei 2024 • 14:00 - 15:30 WIB',
      bookingCode: '#JH-77291B',
      unreadCount: item.unreadCount,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircleBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#141B2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat Pelanggan</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Search size={20} color="#5B4137" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircleBtn} activeOpacity={0.7}>
            <MoreVertical size={20} color="#5B4137" />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200' }}
            style={styles.storeMiniAvatar}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── SEARCH INPUT ── */}
        <View style={styles.searchBoxWrap}>
          <Search size={18} color="#8F7065" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama customer, isi chat, jadwal..."
            placeholderTextColor="#8F7065"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ── HORIZONTAL CATEGORY TABS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            let count = 0;
            if (tab.key === 'all') count = conversations.length;
            if (tab.key === 'unread') count = totalUnread;
            if (tab.key === 'scheduled') count = 7;
            if (tab.key === 'today') count = 4;
            if (tab.key === 'done') count = 2;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>{tab.label}</Text>
                <View style={[styles.tabBadge, isActive ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── DAFTAR PERCAKAPAN MASUK ── */}
        <View style={styles.conversationList}>
          {filteredConversations.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyTitle}>Tidak ada percakapan</Text>
              <Text style={styles.emptySubtitle}>Pesan pelanggan yang masuk akan muncul di sini.</Text>
            </View>
          ) : (
            filteredConversations.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.conversationCard}
                onPress={() => handleOpenRoom(item)}
                activeOpacity={0.7}
              >
                {/* Customer Avatar & Status Dot */}
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                  <View
                    style={[
                      styles.onlineIndicator,
                      { backgroundColor: item.isOnline ? '#00A874' : '#D3DAEF' },
                    ]}
                  />
                </View>

                {/* Content */}
                <View style={styles.contentWrap}>
                  <View style={styles.titleRow}>
                    <View style={styles.nameGroup}>
                      <Text style={styles.customerNameText} numberOfLines={1}>
                        {item.customerName}
                      </Text>
                      {item.verified && <CheckCheck size={14} color="#006398" />}
                    </View>
                    <Text style={[styles.timeText, item.unreadCount > 0 && styles.timeTextUnread]}>
                      {item.time}
                    </Text>
                  </View>

                  {/* Booking Tags */}
                  <View style={styles.tagsRow}>
                    <View style={styles.serviceTag}>
                      <Text style={styles.serviceTagText} numberOfLines={1}>
                        {item.serviceName}
                      </Text>
                    </View>
                    {item.bookingInfo && (
                      <View style={styles.bookingTag}>
                        <Text style={styles.bookingTagText} numberOfLines={1}>
                          {item.bookingInfo}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Snippet Pesan */}
                  <View style={styles.messageSnippetRow}>
                    {item.unreadCount === 0 && <CheckCheck size={14} color="#8F7065" style={{ marginRight: 4 }} />}
                    <Text
                      style={[styles.snippetText, item.unreadCount > 0 && styles.snippetTextUnread]}
                      numberOfLines={1}
                    >
                      {item.lastMessage}
                    </Text>
                  </View>
                </View>

                {/* Unread Counter Badge */}
                {item.unreadCount > 0 && (
                  <View style={styles.unreadCounterWrap}>
                    <Text style={styles.unreadCounterText}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: '#141B2B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeMiniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },

  scrollContent: {
    paddingBottom: 24,
  },
  searchBoxWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E9EDFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: '#141B2B',
  },

  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9EDFF',
  },
  tabChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  tabChipText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#141B2B',
  },
  tabChipTextActive: {
    color: '#fff',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#fff',
  },
  tabBadgeInactive: {
    backgroundColor: '#F1F3FF',
  },
  tabBadgeText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    color: '#5B4137',
  },
  tabBadgeTextActive: {
    color: '#FF6B00',
  },

  conversationList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  conversationCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E9EDFF',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  customerNameText: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: '#141B2B',
  },
  timeText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    color: '#8F7065',
  },
  timeTextUnread: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  serviceTag: {
    backgroundColor: '#E9EDFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5B4137',
  },
  bookingTag: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006C49',
  },
  messageSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  snippetText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 12,
    color: '#5B4137',
    flex: 1,
  },
  snippetTextUnread: {
    fontFamily: typography.bodySm.fontFamily,
    fontWeight: '700',
    color: '#141B2B',
  },
  unreadCounterWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 4,
  },
  unreadCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  emptyStateBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#141B2B',
  },
  emptySubtitle: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 12,
    color: '#8F7065',
    textAlign: 'center',
    marginTop: 4,
  },
});