import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to register for push notifications on native platforms.
 * Stores the FCM/APNs token in the user's profile for backend use.
 */
export function usePushNotifications() {
  const registerPush = useCallback(async () => {
    // Only works on native platforms
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Register with Apple/Google
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration token:', token.value);

        // Store token in user profile (we'd need a push_token column)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Store the token — in production you'd have a push_tokens table
          await supabase.from('analytics_events').insert({
            event_type: 'push_token_registered',
            user_id: user.id,
            event_data: { token: token.value, platform: Capacitor.getPlatform() },
          });
        }
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration error:', err);
      });

      // Listen for incoming notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      // Listen for notification taps
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action:', action);
        // Navigate to relevant milestone
        const milestoneId = action.notification.data?.milestone_id;
        if (milestoneId) {
          window.location.href = `/triage?milestone=${milestoneId}`;
        }
      });
    } catch (err) {
      console.error('Push notification setup error:', err);
    }
  }, []);

  useEffect(() => {
    registerPush();
  }, [registerPush]);
}
