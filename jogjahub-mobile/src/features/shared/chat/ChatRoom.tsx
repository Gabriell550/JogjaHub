import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { chatApi, type ChatRole, type Message } from '../../../api/chatApi';
import { apiErrorMessage } from '../../../api/apiErrorMessage';
import { colors, radius } from '../../../constants/theme';

export default function ChatRoom({ role, id }: { role: ChatRole; id: number | string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const loadingOlder = useRef(false);

  const merge = useCallback((incoming: Message[]) => {
    setMessages(previous => {
      const byId = new Map(previous.map(message => [message.id, message]));
      incoming.forEach(message => byId.set(message.id, message));
      return [...byId.values()].sort((a, b) => b.id - a.id);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    let loading = false;

    async function refresh() {
      if (loading) return;
      loading = true;
      try {
        const { data } = await chatApi.messages(role, id, 1);
        if (!active) return;
        merge(data.data);
        setLastPage(data.last_page);
        setError(false);
        if (data.data.some(message => !message.is_mine && !message.read_at)) await chatApi.markRead(role, id);
      } catch {
        if (active) setError(true);
      } finally {
        loading = false;
      }
    }
    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [role, id, merge, attempt]));

  async function loadOlder() {
    if (loadingOlder.current || page >= lastPage) return;
    loadingOlder.current = true;
    try {
      const { data } = await chatApi.messages(role, id, page + 1);
      merge(data.data);
      setPage(page + 1);
    } catch (error) {
      Alert.alert('Pesan lama gagal dimuat', apiErrorMessage(error, 'Coba lagi nanti.'));
    } finally {
      loadingOlder.current = false;
    }
  }

  async function send() {
    const body = draft.trim();
    if (!body || busy.current) return;
    busy.current = true;
    setSending(true);
    try {
      const { data } = await chatApi.send(role, id, body);
      merge([data.data]);
      setDraft('');
    } catch (error) {
      Alert.alert('Pesan gagal dikirim', apiErrorMessage(error, 'Coba lagi nanti.'));
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {error && <Text style={styles.notice} onPress={() => setAttempt(value => value + 1)}>Pesan gagal dimuat. Coba lagi.</Text>}
      <FlatList data={messages} inverted keyExtractor={item => String(item.id)} contentContainerStyle={styles.list}
        ListFooterComponent={page < lastPage ? <Text onPress={loadOlder}>Muat pesan sebelumnya</Text> : undefined}
        renderItem={({ item }) => <View style={[styles.bubble, item.is_mine && styles.own]}>
          <Text>{item.body}</Text>
          <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>} />
      <View style={styles.composer}>
        <TextInput accessibilityLabel="Tulis pesan" placeholder="Tulis pesan" value={draft} onChangeText={setDraft} editable={!sending}
          maxLength={2000} multiline style={styles.input} />
        <TouchableOpacity accessibilityRole="button" disabled={sending || !draft.trim()} onPress={send}>
          <Text style={styles.send}>{sending ? 'Mengirim...' : 'Kirim'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  list: { padding: 16, gap: 10 },
  bubble: { alignSelf: 'flex-start', maxWidth: '85%', borderRadius: radius.md, backgroundColor: colors.surfaceContainerHigh, padding: 12 },
  own: { alignSelf: 'flex-end', backgroundColor: colors.primaryFixed },
  time: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.surfaceContainerLowest },
  input: { flex: 1, minHeight: 44, maxHeight: 120, padding: 8, color: colors.onSurface },
  notice: { padding: 12, color: colors.error },
  send: { color: colors.primary, padding: 8 },
});
