import React from 'react';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import { Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { store } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Lexend-Bold': Lexend_700Bold,
    'Lexend-SemiBold': Lexend_600SemiBold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
