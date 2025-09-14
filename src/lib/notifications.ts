
'use client';

import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export const registerForPushNotifications = async (userId: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Push notifications are only available on native platforms.");
    return false;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    // Register with Apple / Google to get a device token
    await PushNotifications.register();

    // Listener for registration success
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      // Save the token to the user's document in Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        fcmTokens: arrayUnion(token.value)
      });
    });

    // Listener for registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
    });

    // Listener for incoming notifications when app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received:', notification);
      // You could show an in-app toast here if you want
    });
    
    // Listener for notification action performed
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push action performed:', notification);
    });
    
    return true;
  } catch (error) {
    console.error("Error setting up push notifications:", error);
    return false;
  }
};
