import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VendorProfileStackParamList } from '../../../../navigation/types';
import ChatRoom from '../../../shared/chat/ChatRoom';

export default function VendorChatRoomScreen({ route }: NativeStackScreenProps<VendorProfileStackParamList, 'VendorChatRoom'>) {
  return <ChatRoom key={route.params.conversationId} role="tenant" id={route.params.conversationId} />;
}
