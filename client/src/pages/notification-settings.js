/**
 * Notification Settings Page
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NotificationSettings from "../components/common/NotificationSettings";
import AppLayout from "../components/layout/AppLayout";
import API from "../services/api";

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Verify token is valid by fetching user profile
        const res = await API.get("/users/profile");
        setUser(res.data);
      } catch (error) {
        console.error("Auth error:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-slate-400">Loading notification settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout title="Notification Settings" showSettings={false}>
      <div className="space-y-6">
        <div className="glass-card px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-100">
            Notification Preferences
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Configure how you receive notifications, manage do-not-disturb
            schedules, and set up escalation rules.
          </p>
        </div>

        {/* Settings Component */}
        <NotificationSettings />

        {/* Help Section */}
        <div className="glass-card px-6 py-4">
          <h4 className="font-semibold text-slate-100">Help & Tips</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Instant:</strong> Get notified immediately when
                something happens.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Daily Digest:</strong> Receive a summary of all
                notifications at the end of the day.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Weekly Digest:</strong> Get a weekly summary of
                notifications.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Do Not Disturb:</strong> Silence notifications during
                specific times or days.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Critical Only:</strong> During DND, important mentions
                and urgent alerts still come through.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Escalation:</strong> Auto-escalate unread mentions to
                ensure important messages aren't missed.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
