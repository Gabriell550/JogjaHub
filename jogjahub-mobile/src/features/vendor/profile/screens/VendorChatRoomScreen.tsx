import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  MoreVertical,
  Check,
  CheckCheck,
  Send,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography } from '../../../../constants/theme';

type Message = {
  id: string;
  sender: 'customer' | 'vendor' | 'system';
  text: string;
  time: string;
  inquiryCard?: {
    title: string;
    price: number;
    slot: string;
    imageUrl: string;
  };
  isAutoReply?: boolean;
};

const TEMPLATE_REPLIES = [
  '⚡ Halo, slot jam tersebut sudah kami konfirmasi otomatis ya kak!',
  '📅 Mohon ditunggu, kami sedang memeriksa jadwal terapis/kamar.',
  '💅 Terima kasih atas pesanan Anda di JogjaHub!',
  '🏷️ Ada penambahan paket atau request khusus sebelum dimulai kak?',
];

export default function VendorChatRoomScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    conversationId = 'conv-1',
    customerName = 'Annisa Dwi',
    customerAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
    serviceName = 'Korean Gel Nail Art & Spa Aesthetic',
    servicePrice = 145000,
    bookingTime = 'Besok, 24 Mei 2024 • 14:00 - 15:30 WIB',
    bookingCode = '#JH-77291B',
  } = route.params || {};

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'customer',
      text: 'Halo kak, saya sudah pilih & kunci jadwal untuk besok jam 14:00 di kalender JogjaHub ya. Untuk nail art-nya bisa request motif floral pastel glitter seperti di foto katalog? 🙏✨',
      time: '14:02',
      inquiryCard: {
        title: serviceName,
        price: servicePrice,
        slot: 'Slot 14:00 - 15:30 WIB',
        imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=300',
      },
    },
    {
      id: 'm-2',
      sender: 'system',
      text: 'Jadwal telah masuk dan terkonfirmasi otomatis di Kalender Anda.',
      time: '14:02',
    },
    {
      id: 'm-3',
      sender: 'vendor',
      text: 'Halo Kak Annisa! Slot jadwal jam 14:00 sudah terkonfirmasi otomatis di kalender kami. Bisa banget request motif floral pastel, free konsultasi desain kuku sebelum mulai ya kak ✨',
      time: '14:02',
      isAutoReply: true,
    },
    {
      id: 'm-4',
      sender: 'customer',
      text: 'Wah asik banget, terima kasih kak! Ditunggu besok yaa 💅',
      time: '14:04',
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat tersimpan di storage lokal untuk percakapan ini
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`@jogjahub_room_${conversationId}`);
        if (stored) {
          setMessages(JSON.parse(stored));
        }
      } catch {}
    })();
  }, [conversationId]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputMessage;
    if (!content.trim()) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'vendor',
      text: content.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const next = [...messages, newMsg];
    setMessages(next);
    setInputMessage('');

    try {
      await AsyncStorage.setItem(`@jogjahub_room_${conversationId}`, JSON.stringify(next));
    } catch {}

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleNavigateCalendar = () => {
    navigation.getParent()?.navigate('Calendar');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── HEADER ROOM ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircleBtn} activeOpacity={0.7}>
              <ArrowLeft size={22} color="#141B2B" />
            </TouchableOpacity>

            <View style={styles.avatarWrap}>
              <Image source={{ uri: customerAvatar }} style={styles.avatarImg} />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.customerMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.customerName}>{customerName}</Text>
                <View style={styles.customerTag}>
                  <Text style={styles.customerTagText}>Pelanggan</Text>
                </View>
              </View>
              <Text style={styles.onlineText}>
                <Text style={{ color: '#00A874', fontWeight: '700' }}>● Online</Text> • Jogja Member
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={handleNavigateCalendar} activeOpacity={0.7}>
              <Calendar size={20} color="#0EA5E9" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => Alert.alert('Opsi Chat', 'Kelola informasi pelanggan & lampiran')}
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color="#5B4137" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PINNED CONTEXT BAR: DETAIL BOOKING PELANGGAN ── */}
        <View style={styles.contextBanner}>
          <View style={styles.contextCard}>
            <View style={styles.contextTopRow}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=200' }}
                style={styles.contextImg}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.contextTitleRow}>
                  <Text style={styles.contextTitle} numberOfLines={1}>
                    {serviceName}
                  </Text>
                  <Text style={styles.contextPrice}>Rp {servicePrice.toLocaleString('id-ID')}</Text>
                </View>

                <View style={styles.contextBadgeRow}>
                  <Text style={styles.contextBookingCode}>{bookingCode}</Text>
                  <View style={styles.contextConfirmedBadge}>
                    <Check size={10} color="#006C49" />
                    <Text style={styles.contextConfirmedBadgeText}>Terkonfirmasi Otomatis</Text>
                  </View>
                </View>

                <View style={styles.contextScheduleRow}>
                  <Calendar size={12} color="#FF6B00" />
                  <Text style={styles.contextScheduleText} numberOfLines={1}>
                    {bookingTime}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.contextActionRow}>
              <TouchableOpacity
                style={styles.contextBtnSecondary}
                onPress={() => Alert.alert('Detail Reservasi', `Kode: ${bookingCode}\nLayanan: ${serviceName}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.contextBtnSecondaryText}>Detail Reservasi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contextBtnPrimary}
                onPress={handleNavigateCalendar}
                activeOpacity={0.7}
              >
                <Calendar size={13} color="#0284C7" />
                <Text style={styles.contextBtnPrimaryText}>Lihat di Kalender Toko</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── CHAT SCROLL CONTAINER ── */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatScroll}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>Hari Ini</Text>
          </View>

          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <View key={msg.id} style={styles.systemNotifyBox}>
                  <View style={styles.systemIconCircle}>
                    <Check size={11} color="#fff" />
                  </View>
                  <Text style={styles.systemNotifyText}>{msg.text}</Text>
                </View>
              );
            }

            if (msg.sender === 'customer') {
              return (
                <View key={msg.id} style={styles.customerMsgRow}>
                  <Image source={{ uri: customerAvatar }} style={styles.msgAvatar} />
                  <View style={styles.customerBubbleContainer}>
                    {msg.inquiryCard && (
                      <View style={styles.inquiryCardBox}>
                        <Image source={{ uri: msg.inquiryCard.imageUrl }} style={styles.inquiryImg} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inquiryLabel}>Inquiry Booking</Text>
                          <Text style={styles.inquiryTitle} numberOfLines={1}>
                            {msg.inquiryCard.title}
                          </Text>
                          <Text style={styles.inquiryPrice}>
                            Rp {msg.inquiryCard.price.toLocaleString('id-ID')}
                          </Text>
                        </View>
                      </View>
                    )}
                    <View style={styles.customerBubble}>
                      <Text style={styles.customerMsgText}>{msg.text}</Text>
                    </View>
                    <Text style={styles.msgTimeCustomer}>{msg.time}</Text>
                  </View>
                </View>
              );
            }

            // Vendor Message
            return (
              <View key={msg.id} style={styles.vendorMsgRow}>
                {msg.isAutoReply && (
                  <View style={styles.autoReplyBadge}>
                    <Sparkles size={11} color="#FF6B00" />
                    <Text style={styles.autoReplyBadgeText}>Auto-Reply Bot</Text>
                  </View>
                )}
                <View style={styles.vendorBubble}>
                  <Text style={styles.vendorMsgText}>{msg.text}</Text>
                </View>
                <View style={styles.vendorMsgMeta}>
                  <Text style={styles.msgTimeVendor}>{msg.time}</Text>
                  <CheckCheck size={13} color="#8F7065" />
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ── QUICK TEMPLATES ACTION CHIPS ── */}
        <View style={styles.quickChipsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsScroll}>
            <TouchableOpacity
              style={styles.chipOrange}
              onPress={() => handleSendMessage('Halo kak, terima kasih atas pesanan Anda!')}
              activeOpacity={0.8}
            >
              <Zap size={12} color="#fff" />
              <Text style={styles.chipOrangeText}>Template Balas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chipOutline} onPress={handleNavigateCalendar} activeOpacity={0.8}>
              <Text style={styles.chipOutlineText}>📅 Cek Slot Kalender</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipOutline}
              onPress={() => handleSendMessage('Berikut katalog model terbaru kami ya kak ✨')}
              activeOpacity={0.8}
            >
              <Text style={styles.chipOutlineText}>💅 Kirim Katalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipOutline}
              onPress={() => handleSendMessage('Apakah ingin sekalian tambah perawatan ekstra kak?')}
              activeOpacity={0.8}
            >
              <Text style={styles.chipOutlineText}>🏷️ Add-on Treatment</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── INPUT BAR ── */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => Alert.alert('Lampiran', 'Pilih foto katalog atau promo untuk dikirimkan')}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FF6B00" />
          </TouchableOpacity>

          <View style={styles.textInputBox}>
            <TextInput
              style={styles.inputField}
              placeholder={`Ketik balasan untuk ${customerName}...`}
              placeholderTextColor="#94A3B8"
              value={inputMessage}
              onChangeText={setInputMessage}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, !inputMessage.trim() && { opacity: 0.6 }]}
            onPress={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            activeOpacity={0.8}
          >
            <Send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  customerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerTag: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  customerTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9A3412',
  },
  onlineText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  // Context Banner
  contextBanner: {
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contextCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  contextTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contextImg: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  contextTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  contextPrice: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#FF6B00',
    marginLeft: 4,
  },
  contextBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  contextBookingCode: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  contextConfirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  contextConfirmedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  contextScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  contextScheduleText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  contextActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contextBtnSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  contextBtnSecondaryText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  contextBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  contextBtnPrimaryText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Chat Scroll
  chatScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  dateDivider: {
    alignSelf: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginVertical: 4,
  },
  dateDividerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  systemNotifyBox: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '92%',
  },
  systemIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemNotifyText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
  },
  customerMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '88%',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 2,
  },
  customerBubbleContainer: {
    flex: 1,
  },
  inquiryCardBox: {
    backgroundColor: '#FFF7ED',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#FED7AA',
  },
  inquiryImg: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  inquiryLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FF6B00',
    textTransform: 'uppercase',
  },
  inquiryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  inquiryPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B00',
  },
  customerBubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerMsgText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 18,
  },
  msgTimeCustomer: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    marginLeft: 4,
  },

  vendorMsgRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  autoReplyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 4,
  },
  autoReplyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF6B00',
  },
  vendorBubble: {
    backgroundColor: '#FF6B00',
    padding: 10,
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  vendorMsgText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: '#fff',
    lineHeight: 18,
  },
  vendorMsgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginRight: 4,
  },
  msgTimeVendor: {
    fontSize: 9,
    color: '#94A3B8',
  },

  // Quick Action Chips
  quickChipsBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 6,
  },
  quickChipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chipOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  chipOrangeText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  chipOutline: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  chipOutlineText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },

  // Input Bar
  inputBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  textInputBox: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  inputField: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: '#0F172A',
    padding: 0,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
});