import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiRequest, bearerHeaders } from '@fixarg/api-client';

/**
 * Expo Go en Android: las push remotas no están soportadas y puede aparecer
 * "runtime not ready: ... android push notifications (remote notifications)".
 * No cargamos expo-notifications en ese entorno.
 */
function isExpoGoAndroid() {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

export async function registerExpoPushIfPossible(authToken) {
  if (!authToken) return null;
  if (isExpoGoAndroid()) return null;

  try {
    const Device = await import('expo-device');
    if (!Device.isDevice) return null;

    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    let expoPushToken = null;
    try {
      const res = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      expoPushToken = res?.data ?? null;
    } catch (e) {
      console.warn('getExpoPushTokenAsync', e?.message || e);
      return null;
    }
    if (!expoPushToken) return null;

    try {
      await apiRequest('/api/users/me', {
        method: 'PATCH',
        headers: bearerHeaders(authToken),
        body: JSON.stringify({ expoPushToken }),
      });
    } catch (e) {
      console.warn('Guardar expo push token', e?.message || e);
    }
    return expoPushToken;
  } catch (e) {
    console.warn('registerExpoPushIfPossible', e?.message || e);
    return null;
  }
}