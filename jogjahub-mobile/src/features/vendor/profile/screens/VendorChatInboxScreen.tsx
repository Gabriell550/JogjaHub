import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VendorProfileStackParamList } from '../../../../navigation/types';
import ChatInbox from '../../../shared/chat/ChatInbox';

export default function VendorChatInboxScreen({ navigation }: NativeStackScreenProps<VendorProfileStackParamList, 'VendorChatInbox'>) {
  return <ChatInbox role="tenant" open={(id, name) => navigation.navigate('VendorChatRoom', { conversationId: String(id), customerName: name })} />;
}
