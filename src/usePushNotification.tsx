import { useRef, useEffect } from 'react';

interface NotificationOptions {
    badge?: string;
    icon?: string;
}

const usePushNotification = () => {
    const notificationRef = useRef<Notification | null>(null);

    useEffect(() => {
        if (!('Notification' in window)) {
            console.error('This browser does not support desktop notification');
            return;
        }

        if (Notification.permission !== 'granted') {
            Notification.requestPermission().then((permission) => {
                if (permission !== 'granted') return;
            }).catch((error) => {
                console.error('Notification permission request failed', error);
            });
        }
    }, []);

    const setNotificationClickEvent = () => {
        if (notificationRef.current) {
            notificationRef.current.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notificationRef.current?.close();
            };
        }
    };

    const fireNotification = (title: string, options: NotificationOptions) => {
        if (Notification.permission === 'granted') {
            const newOptions: NotificationOptions = {
                badge: '',
                icon: '',
                ...options,
            };

            notificationRef.current = new Notification(title, newOptions);
            setNotificationClickEvent();
        } else {
            console.error('Notification permission is not granted');
        }
    };

    return { fireNotification };
};

export default usePushNotification;
