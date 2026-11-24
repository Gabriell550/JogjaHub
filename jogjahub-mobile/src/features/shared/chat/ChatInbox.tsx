import React, { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { chatApi, type ChatRole, type Conversation } from '../../../api/chatApi';

export default function ChatInbox({ role, open }: { role: ChatRole; open: (id: number, name: string) => void }) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt(value => value + 1);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    chatApi.list(role).then(({ data }) => {
      if (active) setItems(data.data);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [role, attempt]));

  return <FlatList data={items} keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={retry}
    contentContainerStyle={{ padding: 16, gap: 12 }}
    ListHeaderComponent={error ? <Text onPress={retry}>Percakapan gagal dimuat. Coba lagi.</Text> : undefined}
    ListEmptyComponent={!loading && !error ? <Text>Belum ada percakapan.</Text> : undefined}
    renderItem={({ item }) => {
      const name = role === 'tenant' ? item.customer.name : item.tenant.name;
      return <TouchableOpacity accessibilityRole="button" style={{ padding: 14, backgroundColor: 'white' }} onPress={() => open(item.id, name)}>
        <Text style={{ fontWeight: '600' }}>{name}{item.unread_count > 0 ? ' (' + item.unread_count + ')' : ''}</Text>
        <Text numberOfLines={1}>{item.latest_message?.body ?? 'Belum ada pesan'}</Text>
      </TouchableOpacity>;
    }} />;
}
