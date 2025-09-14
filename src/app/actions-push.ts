
'use server';
import * as admin from 'firebase-admin';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Try to initialize with default application credentials
    admin.initializeApp({
      credential: credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    // You might want to log this error to a monitoring service
    // In a local dev environment, this might fail if GOOGLE_APPLICATION_CREDENTIALS is not set.
  }
}

interface SendPushNotificationParams {
    token: string;
    title: string;
    body: string;
    senderAvatar?: string;
}

export async function sendPushNotification({ token, title, body, senderAvatar }: SendPushNotificationParams) {
    if (admin.apps.length === 0) {
        console.error("Firebase Admin SDK not initialized. Cannot send push notification.");
        return { success: false, message: 'Firebase Admin not initialized.' };
    }
    
    if (!token) {
        console.error("No device token provided for push notification.");
        return { success: false, message: 'No device token.' };
    }

    const message: admin.messaging.Message = {
        token,
        notification: {
            title,
            body,
        },
        webpush: {
            notification: {
                icon: senderAvatar || '/icon-192x192.png',
            },
        },
        android: {
            notification: {
                icon: 'ic_stat_name', // Make sure you have this drawable in your Android resources
                color: '#1a73e8',
            },
        },
        apns: {
            payload: {
                aps: {
                    'mutable-content': 1,
                },
            },
            fcm_options: {
                image: senderAvatar,
            },
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error };
    }
}
