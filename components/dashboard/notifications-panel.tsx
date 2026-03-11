"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MessageCircle,
  X,
  Leaf,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api, { Notification, ChatRoom } from "@/src/api/client";
import { formatDistanceToNow } from "date-fns";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [notifs, rooms, unread] = await Promise.all([
        api.getNotifications({ limit: 20 }),
        api.getChatRooms(),
        api.getUnreadNotificationCount(),
      ]);
      setNotifications(notifs);
      setChatRooms(rooms);
      setUnreadCount(unread.count);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const unreadNotifs = notifications.filter((n) => !n.is_read);
      await Promise.all(unreadNotifs.map((n) => api.markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "collection":
        return <Leaf size={16} className="text-primary" />;
      case "approved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "rejected":
        return <XCircle size={16} className="text-red-500" />;
      case "nursery":
        return <Building2 size={16} className="text-blue-500" />;
      case "availability":
        return <Leaf size={16} className="text-primary" />;
      case "welcome":
        return <User size={16} className="text-primary" />;
      case "system":
        return <Bell size={16} className="text-[var(--very-dark-color)]/50" />;
      default:
        return <Bell size={16} className="text-[var(--very-dark-color)]/50" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-paper shadow-custom flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--very-dark-color)]/10">
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={markingAllRead}
                className="text-xs"
              >
                {markingAllRead ? "Marking..." : "Mark all read"}
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--very-dark-color)]/10">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "notifications"
                ? "text-primary border-b-2 border-primary"
                : "text-[var(--very-dark-color)]/60 hover:text-[var(--very-dark-color)]"
            }`}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={16} className="inline mr-2" />
            Notifications
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "messages"
                ? "text-primary border-b-2 border-primary"
                : "text-[var(--very-dark-color)]/60 hover:text-[var(--very-dark-color)]"
            }`}
            onClick={() => setActiveTab("messages")}
          >
            <MessageCircle size={16} className="inline mr-2" />
            Messages
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "notifications" ? (
            notifications.length > 0 ? (
              <div className="divide-y divide-[var(--very-dark-color)]/10">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-pale transition-colors cursor-pointer ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pale flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[var(--very-dark-color)]">
                          {notification.title}
                        </p>
                        <p className="text-sm text-[var(--very-dark-color)]/70 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--very-dark-color)]/50">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[var(--very-dark-color)]/50">
                <div className="w-16 h-16 rounded-full bg-pale flex items-center justify-center mb-4">
                  <Bell size={32} className="opacity-30" />
                </div>
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1 opacity-75">
                  You&apos;ll see updates here when they happen
                </p>
              </div>
            )
          ) : chatRooms.length > 0 ? (
            <div className="divide-y divide-[var(--very-dark-color)]/10">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 hover:bg-pale transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--very-dark-color)]">
                        {room.user1?.name || room.user2?.name || room.name || "Chat"}
                      </p>
                      {room.last_message && (
                        <p className="text-sm text-[var(--very-dark-color)]/60 truncate">
                          {room.last_message}
                        </p>
                      )}
                    </div>
                    {room.last_message_at && (
                      <span className="text-xs text-[var(--very-dark-color)]/50">
                        {formatDistanceToNow(new Date(room.last_message_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--very-dark-color)]/50">
              <div className="w-16 h-16 rounded-full bg-pale flex items-center justify-center mb-4">
                <MessageCircle size={32} className="opacity-30" />
              </div>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1 opacity-75">
                Start a conversation with nurseries
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPanel;
