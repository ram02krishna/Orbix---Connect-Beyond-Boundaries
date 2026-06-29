"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  ShieldAlert,
  Trash2,
  Loader2,
  Sparkles,
  User,
  Lock,
  Palette,
  Check,
  SmartphoneIcon,
  Shield,
  Eye,
  EyeOff,
  Bell
} from "lucide-react";
import { useAuthStore } from "@hooks/useAuthStore";
import { useSocketStore } from "@hooks/useSocketStore";
import { Button } from "@components/ui/Button";
import api from "@lib/api";

type TabType = "profile" | "security" | "notifications";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Profile fields state
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security & Privacy states
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Simulated & Local Settings
  const [readReceipts, setReadReceipts] = useState(true);
  const [autoLock, setAutoLock] = useState("never");
  const [screenLockPin, setScreenLockPin] = useState("");
  const [enableScreenLock, setEnableScreenLock] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsSound, setNotificationsSound] = useState(true);
  const [notificationsPreview, setNotificationsPreview] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "default">("default");

  useEffect(() => {
    setMounted(true);
    setTheme("system");

    // Initial load from localStorage
    if (typeof window !== "undefined") {
      setReadReceipts(localStorage.getItem("settings-read-receipts") !== "false");
      setAutoLock(localStorage.getItem("settings-auto-lock") || "never");
      setScreenLockPin(localStorage.getItem("settings-screen-lock-pin") || "");
      setEnableScreenLock(localStorage.getItem("settings-screen-lock-enabled") === "true");
      setNotificationsEnabled(localStorage.getItem("settings-notifications-enabled") !== "false");
      setNotificationsSound(localStorage.getItem("settings-notifications-sound") !== "false");
      setNotificationsPreview(localStorage.getItem("settings-notifications-preview") !== "false");
      if (typeof Notification !== "undefined") {
        setPermissionStatus(Notification.permission);
      }
    }
  }, [setTheme]);

  // Pre-populate profile fields
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileUsername(user.username || "");
      setProfileBio((user as any).bio || "");
      setProfileAvatar(user.avatarUrl || "");
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data.data.sessions);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      void fetchSessions();
    }
  }, [mounted]);

  // Actions
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSavingProfile(true);

    try {
      const res = await api.patch("/users/me", {
        name: profileName,
        username: profileUsername,
        bio: profileBio,
        avatarUrl: profileAvatar,
      });

      const updatedUser = res.data.data.user;
      updateUser(updatedUser);
      setSuccessMsg("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setError("");
    setSuccessMsg("");
    setRevokingId(sessionId);
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSuccessMsg("Session revoked successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to revoke session.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm("Are you sure you want to log out of all other devices?")) return;
    setError("");
    setSuccessMsg("");
    setRevokingAll(true);
    try {
      await api.delete("/sessions");
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSuccessMsg("Logged out of all other sessions successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to revoke other sessions.");
    } finally {
      setRevokingAll(false);
    }
  };

  // Local settings triggers
  const handleToggleReadReceipts = () => {
    const val = !readReceipts;
    setReadReceipts(val);
    localStorage.setItem("settings-read-receipts", String(val));
    setSuccessMsg(`Read receipts ${val ? "enabled" : "disabled"}.`);
  };

  const handleAutoLockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAutoLock(val);
    localStorage.setItem("settings-auto-lock", val);
  };

  const handleToggleScreenLock = () => {
    if (enableScreenLock) {
      // disabling
      setEnableScreenLock(false);
      setScreenLockPin("");
      localStorage.setItem("settings-screen-lock-enabled", "false");
      localStorage.removeItem("settings-screen-lock-pin");
      setSuccessMsg("Screen lock disabled.");
    } else {
      if (screenLockPin.length < 4) {
        setError("Please enter a valid 4-digit PIN first.");
        return;
      }
      setEnableScreenLock(true);
      localStorage.setItem("settings-screen-lock-enabled", "true");
      localStorage.setItem("settings-screen-lock-pin", screenLockPin);
      setSuccessMsg("Screen lock configuration saved successfully!");
    }
  };

  // Notification actions
  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      setError("Desktop notifications are not supported in this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === "granted") {
        setSuccessMsg("Browser notifications enabled successfully!");
        new Notification("Orbix Alert", { body: "Browser notifications are now functional!" });
      } else if (permission === "denied") {
        setError("Notifications permission was blocked. Please reset site permissions in your browser.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to request push notification permission.");
    }
  };

  const handleToggleNotifications = () => {
    const val = !notificationsEnabled;
    setNotificationsEnabled(val);
    localStorage.setItem("settings-notifications-enabled", String(val));
    setSuccessMsg(`Push notifications ${val ? "enabled" : "disabled"}.`);
  };

  const handleToggleSound = () => {
    const val = !notificationsSound;
    setNotificationsSound(val);
    localStorage.setItem("settings-notifications-sound", String(val));
    setSuccessMsg(`Conversation sounds ${val ? "enabled" : "disabled"}.`);
  };

  const handleTogglePreview = () => {
    const val = !notificationsPreview;
    setNotificationsPreview(val);
    localStorage.setItem("settings-notifications-preview", String(val));
    setSuccessMsg(`Message text preview ${val ? "enabled" : "disabled"}.`);
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#eff3f1] dark:bg-[#080d0b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      
      {/* Header Banner */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-200/50 dark:border-white/5 bg-white dark:bg-[#111b21] shadow-sm relative z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/chats")}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-[#54656f] dark:text-[#aebac1] hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#111b21] dark:text-[#e9edef] leading-tight">Settings & Security</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Customize your security profile, push updates, and active logins.</p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left tabs selector panel */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200/50 dark:border-white/5 bg-white/70 dark:bg-[#111b21]/50 backdrop-blur-md p-4 flex flex-row md:flex-col gap-2.5 overflow-x-auto md:overflow-x-visible flex-shrink-0 select-none">
          <button
            onClick={() => { setActiveTab("profile"); setError(""); setSuccessMsg(""); }}
            className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap w-full ${
              activeTab === "profile"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <User size={16} />
            My Profile
          </button>

          <button
            onClick={() => { setActiveTab("notifications"); setError(""); setSuccessMsg(""); }}
            className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap w-full ${
              activeTab === "notifications"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Bell size={16} />
            Notifications
          </button>

          <button
            onClick={() => { setActiveTab("security"); setError(""); setSuccessMsg(""); }}
            className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap w-full ${
              activeTab === "security"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Lock size={16} />
            Security & Privacy
          </button>
        </div>

        {/* Tab display Content box */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-3xl">
          
          {/* Notification status bars */}
          {error && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-400 font-semibold animate-pulse-slow">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 text-sm text-blue-400 font-semibold animate-pulse-slow">
              {successMsg}
            </div>
          )}

          {/* TAB 1: PROFILE EDITOR */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-200/50 dark:border-white/5 p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Public Profile</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Display Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full text-base sm:text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Username</label>
                    <input
                      type="text"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                      required
                      placeholder="e.g. johndoe"
                      className="w-full text-base sm:text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Avatar Image URL</label>
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full text-base sm:text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Biography</label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full text-base sm:text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile} className="bg-blue-500 hover:bg-blue-600 font-semibold px-6 py-2.5 cursor-pointer text-sm">
                  {savingProfile ? (
                    <>
                      <Loader2 className="animate-spin mr-1.5" size={15} />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: NOTIFICATIONS PANEL */}
          {activeTab === "notifications" && (
            <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-200/50 dark:border-white/5 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Browser Notifications</h3>

              {/* Push permission control */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 border-b border-zinc-150/40 dark:border-white/5 gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">System Permission Status</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450">
                    Status: <span className="font-bold capitalize">{permissionStatus}</span>
                  </p>
                </div>
                {permissionStatus !== "granted" ? (
                  <Button
                    type="button"
                    onClick={handleRequestPermission}
                    className="bg-blue-500 hover:bg-blue-600 text-xs font-bold px-4 py-2 cursor-pointer"
                  >
                    Enable Notifications
                  </Button>
                ) : (
                  <span className="text-xs font-bold bg-blue-500/25 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 select-none">
                    <Check size={13} /> Active
                  </span>
                )}
              </div>

              {/* Enable alerts */}
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-150/40 dark:border-white/5">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Show Alerts</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450">Receive browser notifications for new messages when minimized.</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  disabled={permissionStatus !== "granted"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none disabled:opacity-50 ${
                    notificationsEnabled && permissionStatus === "granted" ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled && permissionStatus === "granted" ? "translate-x-5.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Play sounds */}
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-150/40 dark:border-white/5">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Conversation Tones</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450">Play sounds for incoming and outgoing messages.</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                    notificationsSound ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${
                      notificationsSound ? "translate-x-5.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Message text previews */}
              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Show Previews</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450">Show sender name and message details inside push banner.</p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                    notificationsPreview ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${
                      notificationsPreview ? "translate-x-5.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & DEVICE SESSIONS */}
          {activeTab === "security" && (
            <div className="space-y-6">
              
              {/* Privacy settings options */}
              <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-200/50 dark:border-white/5 p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Privacy Controls</h3>
                
                {/* Read receipts */}
                <div className="flex items-center justify-between py-3.5 border-b border-zinc-150/40 dark:border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Read Receipts</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-450">Let others know when you have read their messages.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleReadReceipts}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                      readReceipts ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${
                        readReceipts ? "translate-x-5.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Auto logout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 border-b border-zinc-150/40 dark:border-white/5 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Inactive Lockout</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-450">Auto disconnect session after a set time of inactivity.</p>
                  </div>
                  <CustomSelect
                    value={autoLock}
                    onChange={(val) => {
                      setAutoLock(val);
                      localStorage.setItem("settings-auto-lock", val);
                      setSuccessMsg(`Auto lockout timer set to ${val === "never" ? "never" : val + " minute(s)"}.`);
                    }}
                    options={[
                      { value: "never", label: "Never Lock" },
                      { value: "1", label: "1 Minute" },
                      { value: "5", label: "5 Minutes" },
                      { value: "15", label: "15 Minutes" },
                      { value: "60", label: "1 Hour" },
                    ]}
                  />
                </div>

                {/* Screen Lock PIN */}
                <div className="space-y-4 py-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Local PIN Screen Lock</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-450">Encrypt and locks view until a 4-digit PIN code is typed.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleScreenLock}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                        enableScreenLock ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${
                          enableScreenLock ? "translate-x-5.5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {!enableScreenLock && (
                    <div className="flex items-center gap-2 max-w-[260px] pt-1">
                      <div className="relative w-full">
                        <input
                          type={showPin ? "text" : "password"}
                          value={screenLockPin}
                          maxLength={4}
                          placeholder="Set 4-digit PIN"
                          onChange={(e) => setScreenLockPin(e.target.value.replace(/\D/g, ""))}
                          className="w-full text-base sm:text-sm px-4 py-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100 font-mono tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                        >
                          {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated 2FA toggle */}
                <div className="flex items-center justify-between py-3.5 border-b border-zinc-150/40 dark:border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-450">Secure logins with Google Authenticator or secondary email OTP codes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const val = !twoFactor;
                      setTwoFactor(val);
                      setSuccessMsg(val ? "2FA Setup simulated: Secondary OTP required on next login." : "2FA settings disabled.");
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                      twoFactor ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${
                        twoFactor ? "translate-x-5.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sessions container box */}
              <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-200/50 dark:border-white/5 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Device Logins</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage actively signed-in platforms.</p>
                  </div>

                  {sessions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRevokeAllOthers}
                      disabled={revokingAll}
                      className="text-red-450 hover:text-red-400 font-bold cursor-pointer text-xs uppercase tracking-wide"
                    >
                      {revokingAll ? "Revoking..." : "Log out all other devices"}
                    </Button>
                  )}
                </div>

                {loadingSessions ? (
                  /* SKELETON DEVICE LOADING SHIMMER */
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/40 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/10 animate-pulse"
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
                          <div className="space-y-2 w-full max-w-[200px]">
                            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-2">No active device logins found.</div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4.5 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-zinc-900/20 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-blue-500 flex-shrink-0">
                            {session.deviceType === "MOBILE" ? <Smartphone size={20} /> : <Monitor size={20} />}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                              {session.deviceName || "Web Client"}
                              {session.isCurrent && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Current
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-normal">
                              IP: {session.ipAddress || "127.0.0.1"} ({session.location || "Unknown Location"}) • Active{" "}
                              {new Date(session.lastSeenAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        {!session.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={revokingId === session.id}
                            className="p-2.5 rounded-xl hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                            title="Revoke session"
                          >
                            {revokingId === session.id ? (
                              <Loader2 size={16} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

function CustomSelect({ value, onChange, options }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative inline-block w-full max-w-[170px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-sm px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-250 font-bold cursor-pointer select-none"
      >
        <span>{selectedOption ? selectedOption.label : "Select..."}</span>
        <svg
          className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-[#1a2329] shadow-lg py-1.5 z-30 animate-fade-up max-h-56 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left text-sm px-4 py-2 hover:bg-blue-500/10 hover:text-blue-500 transition-colors ${
                opt.value === value
                  ? "text-blue-500 bg-blue-500/5 font-bold"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
