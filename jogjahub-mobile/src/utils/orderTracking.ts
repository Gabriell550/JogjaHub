import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEWED_ORDERS_KEY = '@jogjahub:viewed_orders';

export interface ViewedOrder {
  orderId: string;
  viewedAt: number;
}

export const orderTracking = {
  async getViewedOrders(): Promise<Set<string>> {
    try {
      const stored = await AsyncStorage.getItem(VIEWED_ORDERS_KEY);
      if (stored) {
        const parsed: ViewedOrder[] = JSON.parse(stored);
        return new Set(parsed.map((o) => o.orderId));
      }
    } catch (e) {
      console.warn('Failed to load viewed orders:', e);
    }
    return new Set();
  },

  async markAsViewed(orderId: string): Promise<void> {
    try {
      const viewed = await this.getViewedOrders();
      viewed.add(orderId);
      const toStore: ViewedOrder[] = Array.from(viewed).map((id) => ({
        orderId: id,
        viewedAt: Date.now(),
      }));
      await AsyncStorage.setItem(VIEWED_ORDERS_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to mark order as viewed:', e);
    }
  },

  async markMultipleAsViewed(orderIds: string[]): Promise<void> {
    try {
      const viewed = await this.getViewedOrders();
      orderIds.forEach((id) => viewed.add(id));
      const toStore: ViewedOrder[] = Array.from(viewed).map((id) => ({
        orderId: id,
        viewedAt: Date.now(),
      }));
      await AsyncStorage.setItem(VIEWED_ORDERS_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to mark orders as viewed:', e);
    }
  },

  async isViewed(orderId: string): Promise<boolean> {
    const viewed = await this.getViewedOrders();
    return viewed.has(orderId);
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(VIEWED_ORDERS_KEY);
    } catch (e) {
      console.warn('Failed to clear viewed orders:', e);
    }
  },
};