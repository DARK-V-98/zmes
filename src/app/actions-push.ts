
'use server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  // If you have a service account key file, you can use it like this:
  // const serviceAccount = require('./path/to/your/serviceAccountKey.json');
  // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  
  // For environments like Google Cloud Functions or Cloud Run, the SDK
  // can often auto-discover credentials.
  admin.initializeApp();
}

interface SendPushNotificationParams {
    token: string;
    title: string;
    body: string;
    senderAvatar?: string;
}

export async function sendPushNotification({ token, title, body, senderAvatar }: SendPushNotificationParams) {
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
