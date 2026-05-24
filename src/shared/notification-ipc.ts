export const NOTIFICATION_SHOW_CHANNEL = "yahla:notification:show";
export const NOTIFICATION_CLICKED_CHANNEL = "yahla:notification:clicked";

export type NativeNotificationPayload = {
  title: string;
  body?: string;
  id?: string;
  tag?: string;
  conversationId?: string;
  conversationType?: "direct" | "group";
  messageId?: string;
  unreadCount?: number;
  silent?: boolean;
};

export type NativeNotificationClickPayload = Pick<
  NativeNotificationPayload,
  "conversationId" | "conversationType" | "messageId" | "unreadCount"
>;
