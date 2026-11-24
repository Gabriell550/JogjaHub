import { apiClient } from './client';

export type ChatRole = 'customer' | 'tenant';
type Participant = { id: number; name: string; avatar_url?: string };
type Data<T> = { data: T };

export interface Conversation {
  id: number;
  customer: Participant;
  tenant: Participant;
  latest_message?: { body: string; created_at: string };
  unread_count: number;
}

export interface Message {
  id: number;
  body: string;
  is_mine: boolean;
  read_at?: string;
  created_at: string;
}

const threadUrl = (role: ChatRole, id: number | string) => '/' + role + '/conversations/' + id;

export const chatApi = {
  list: (role: ChatRole) => apiClient.get<Data<Conversation[]>>('/' + role + '/conversations'),
  start: (tenantUuid: string) => apiClient.post<Data<Conversation>>('/customer/conversations', { tenant_uuid: tenantUuid }),
  messages: (role: ChatRole, id: number | string, page: number) =>
    apiClient.get<Data<Message[]> & { last_page: number }>(threadUrl(role, id) + '/messages', { params: { page } }),
  send: (role: ChatRole, id: number | string, body: string) =>
    apiClient.post<Data<Message>>(threadUrl(role, id) + '/messages', { body }),
  markRead: (role: ChatRole, id: number | string) => apiClient.patch(threadUrl(role, id) + '/read'),
};
