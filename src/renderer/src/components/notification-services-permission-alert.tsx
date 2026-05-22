import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { NotificationsOffOutlined } from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
}

export default function NotificationServicesPermissionAlert() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isSyncing, setIsSyncing] = useState(true)
    const [publicKey, setPublicKey] = useState('')

    useEffect(() => {
        let isMounted = true

        async function loadSubscription() {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                if (isMounted) {
                    setIsSupported(false)
                    setIsSyncing(false)
                }
                return
            }

            setIsSupported(true)

            const clientConfigResponse = await fetch('https://halabakk-web.nawaf-alhasosah.workers.dev//api/push/config', {
                cache: 'no-store',
            })
            if (!clientConfigResponse.ok) {
                throw new Error('Failed to load push configuration.')
            }
            const clientConfig = (await clientConfigResponse.json()) as {
                success: boolean
                publicKey: string
            }
            if (!clientConfig.publicKey) {
                throw new Error('Missing public VAPID key.')
            }
            setPublicKey(clientConfig.publicKey)

            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
            const existingSubscription = await reg.pushManager.getSubscription()

            if (!isMounted) {
                return
            }

            setSubscription(existingSubscription)

            if (existingSubscription) {
                await fetch('https://halabakk-web.nawaf-alhasosah.workers.dev//api/push/subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        subscription: JSON.parse(JSON.stringify(existingSubscription)),
                    }),
                })
            }

            if (isMounted) {
                setIsSyncing(false)
            }
        }

        loadSubscription().catch(() => {
            if (isMounted) {
                setIsSyncing(false)
            }
        })

        return () => {
            isMounted = false
        }
    }, [])

    async function subscribe() {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        setSubscription(sub)
        await fetch('https://halabakk-web.nawaf-alhasosah.workers.dev//api/push/subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription: JSON.parse(JSON.stringify(sub)),
            }),
        })
    }

    async function unsubscribe() {
        await subscription?.unsubscribe()
        await fetch('https://halabakk-web.nawaf-alhasosah.workers.dev//api/push/subscription', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint: subscription!.endpoint,
            }),
        })
        setSubscription(null)
    }

    return (
        <Alert
            severity="success"
            dir={isRTL ? 'rtl' : 'ltr'}
            onClose={() => { }}
            icon={<NotificationsOffOutlined fontSize="large" sx={{ color: "#25D366" }} />}
            sx={(theme) => ({
                borderRadius: 3,
                display: subscription ? 'none' : 'flex',
                visibility: !isSupported || isSyncing ? 'hidden' : 'visible',
                backgroundColor:
                    theme.palette.mode === "dark" ? "#103529" : "#D9FDD3",
                color: theme.palette.mode === "dark" ? "white" : "black",
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr',
                "& .MuiAlert-icon": {
                    color: theme.palette.mode === "dark" ? "#5cd68a" : "#198754",
                    marginRight: isRTL ? 0 : '12px',
                    marginLeft: isRTL ? '12px' : 0,
                },
                "& .MuiAlert-message": {
                    width: '100%',
                    textAlign: isRTL ? 'right' : 'left',
                },
                "& .MuiAlert-action": {
                    marginRight: isRTL ? 'auto' : 0,
                    marginLeft: isRTL ? 0 : 'auto',
                    paddingRight: isRTL ? '12px' : 0,
                    paddingLeft: isRTL ? 0 : '12px',
                },
            })}
        >
            {isRTL ? 'إشعارات الرسائل غير مفعلة.' : 'Message notifications are off.'}{"  "}
            <button
                onClick={subscribe}
                disabled={!publicKey}
                className='font-semibold text-[#25D366] cursor-pointer hover:text-[#25D366] hover:underline'
            >
                {isRTL ? 'تفعيل' : 'Turn on'}
            </button>
        </Alert>
    )
}
