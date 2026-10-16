'use client';

import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Camera,
  Lock,
  Shield,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Building,
  Send,
  Save,
  Volume2,
  Globe,
  KeyRound,
  Crown,
  Check,
  X,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { ROUTE_PERMISSIONS, getRoleDisplayName } from '../../lib/rbac';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshProfile, updateUserLocal } = useAuth();
  const { locale, setLocale } = useTranslation();
  const isKh = locale === 'km';

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'permissions'>('profile');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logout();
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // Profile Form State
  const [fullNameEn, setFullNameEn] = useState('');
  const [fullNameKh, setFullNameKh] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Status / Feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullNameEn(user.fullNameEn || '');
      setFullNameKh(user.fullNameKh || '');
      setPhone(user.phone || '');
      setDepartment(user.department || '');
      setTelegramUsername(user.telegramUsername || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setNotificationsEnabled(user.notificationsEnabled !== false);
    }
  }, [user]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Upload Avatar to Cloudinary
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input value so selecting the same file triggers change again
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      showFeedback('error', isKh ? 'សូមជ្រើសរើសឯកសាររូបភាពត្រឹមត្រូវ (JPG, PNG, WEBP)' : 'Please select a valid image file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showFeedback('error', isKh ? 'ទំហំរូបភាពមិនត្រូវលើសពី 15MB ឡើយ' : 'Image size cannot exceed 15MB');
      return;
    }

    setUploadingAvatar(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        // 1. Upload to Cloudinary CDN via Backend API
        const uploadRes = await api.upload.uploadImage(base64Data, 'avatars');
        if (!uploadRes || !uploadRes.url) {
          throw new Error('Failed to obtain Cloudinary CDN URL');
        }

        const newAvatarUrl = uploadRes.url;
        setAvatarUrl(newAvatarUrl);

        // 2. Persist to Neon PostgreSQL Database
        await api.users.updateProfile({ avatarUrl: newAvatarUrl });
        updateUserLocal({ avatarUrl: newAvatarUrl });
        await refreshProfile();

        showFeedback(
          'success',
          isKh ? 'បានបង្ហោះរូបតំណាងទៅកាន់ Cloudinary CDN ដោយជោគជ័យ' : 'Avatar uploaded to Cloudinary CDN successfully'
        );
      } catch (err: any) {
        showFeedback(
          'error',
          (isKh ? 'ការបង្ហោះរូបភាពបរាជ័យ: ' : 'Failed to upload image: ') + (err.message || 'Unknown error')
        );
      } finally {
        setUploadingAvatar(false);
      }
    };

    reader.onerror = () => {
      setUploadingAvatar(false);
      showFeedback('error', isKh ? 'មិនអាចអានរូបភាពពីឧបករណ៍បានទេ' : 'Failed to read image file');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await api.users.updateProfile({ avatarUrl: '' });
      setAvatarUrl('');
      updateUserLocal({ avatarUrl: '' });
      await refreshProfile();
      showFeedback('success', isKh ? 'បានលុបរូបតំណាងរួចរាល់' : 'Avatar removed successfully');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);

    try {
      const payload = {
        fullNameEn: fullNameEn.trim(),
        fullNameKh: fullNameKh.trim() || undefined,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        telegramUsername: telegramUsername.trim() || undefined,
        bio: bio.trim() || undefined,
        notificationsEnabled,
      };

      const res = await api.users.updateProfile(payload);
      updateUserLocal(res);
      await refreshProfile();

      showFeedback(
        'success',
        isKh ? 'បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួនដោយជោគជ័យ' : 'Profile updated successfully in database'
      );
    } catch (err: any) {
      showFeedback(
        'error',
        (isKh ? 'កំហុសក្នុងការរក្សាទុក: ' : 'Update failed: ') + (err.message || 'Unknown error')
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showFeedback('error', isKh ? 'សូមបំពេញពាក្យសម្ងាត់ចាស់ និងថ្មី' : 'Please provide current and new password');
      return;
    }

    if (newPassword.length < 8) {
      showFeedback('error', isKh ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ' : 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showFeedback('error', isKh ? 'ការបញ្ជាក់ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ' : 'New passwords do not match');
      return;
    }

    setSavingPassword(true);
    setFeedback(null);

    try {
      await api.auth.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showFeedback(
        'success',
        isKh ? 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ' : 'Password changed successfully'
      );
    } catch (err: any) {
      showFeedback(
        'error',
        (isKh ? 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ: ' : 'Password change failed: ') + (err.message || 'Verification failed')
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Upload Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-teal-800/40 bg-teal-800 text-white flex items-center justify-center shadow-md relative">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={user?.fullNameEn || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-bold">
                  {(user?.fullNameEn || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}

              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white text-[10px]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Cloudinary...</span>
                </div>
              )}
            </div>

            <label
              className="absolute bottom-0 right-0 p-2 bg-teal-800 hover:bg-teal-900 text-white rounded-full cursor-pointer shadow-md transition-transform active:scale-95"
              title={isKh ? 'ប្តូររូបថតពី Cloudinary' : 'Upload photo to Cloudinary'}
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          {/* User Summary Info */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 truncate">
                {isKh && user?.fullNameKh ? user.fullNameKh : user?.fullNameEn}
              </h1>
              {isSuperAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs">
                  <Crown className="w-3.5 h-3.5 text-amber-700" />
                  <span>{getRoleDisplayName(user?.role, isKh)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                  <Shield className="w-3 h-3 text-teal-700" />
                  <span>{getRoleDisplayName(user?.role, isKh)}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 font-mono mb-3">{user?.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs text-stone-600">
              {department && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#F5EFE4] border border-[#E7DFC9]">
                  <Building className="w-3.5 h-3.5 text-stone-500" />
                  <span>{department}</span>
                </span>
              )}
              {phone && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#F5EFE4] border border-[#E7DFC9]">
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>{phone}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isKh ? 'គណនីសកម្ម' : 'Active Account'}</span>
              </span>
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="mt-3 text-[11px] text-rose-600 hover:text-rose-700 font-medium hover:underline inline-block"
              >
                {isKh ? 'លុបរូបតំណាងចេញ' : 'Remove Avatar'}
              </button>
            )}
          </div>

          {/* Header Action: Log Out Button */}
          <div className="shrink-0 flex items-center justify-center sm:self-start">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title={isKh ? 'ចាកចេញពីគណនី' : 'Sign out of your account'}
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>{isKh ? 'ចាកចេញ' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-medium border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E7E1D4] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-teal-800 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-[#F5EFE4]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>{isKh ? 'ព័ត៌មានទូទៅ' : 'Personal Info'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-teal-800 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-[#F5EFE4]'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{isKh ? 'សុវត្ថិភាព & លេខសម្ងាត់' : 'Password & Security'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'bg-teal-800 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-[#F5EFE4]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{isKh ? 'ការកំណត់ & ជូនដំណឹង' : 'Preferences'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-teal-800 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-[#F5EFE4]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{isKh ? 'សិទ្ធិប្រើប្រាស់ (RBAC)' : 'Role Permissions'}</span>
        </button>
      </div>

      {/* Tab 1: Personal Info Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'ឈ្មោះជាភាសាអង់គ្លេស (Full Name English)' : 'Full Name (English)'}
              </label>
              <input
                type="text"
                required
                value={fullNameEn}
                onChange={(e) => setFullNameEn(e.target.value)}
                placeholder="Dr. Sok Chantha"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'ឈ្មោះជាភាសាខ្មែរ (Full Name Khmer)' : 'Full Name (Khmer)'}
              </label>
              <input
                type="text"
                value={fullNameKh}
                onChange={(e) => setFullNameKh(e.target.value)}
                placeholder="លោកវេជ្ជបណ្ឌិត សុខ ចាន់ថា"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'អ៊ីមែលចូលប្រើប្រាស់ (Email Address - Read Only)' : 'Staff Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-stone-100/60 rounded-xl font-mono text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'លេខទូរស័ព្ទទំនាក់ទំនង (Phone Number)' : 'Contact Phone'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012 888 999"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'ផ្នែក ឬឯកទេស (Department / Specialty)' : 'Department / Specialty'}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={isKh ? 'ពិគ្រោះទូទៅ / ឱសថស្ថាន / បេឡា' : 'Internal Medicine / Cashier / Pharmacy'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'Telegram Username សម្រាប់ទទួលដំណឹង' : 'Telegram Username for Alerts'}
              </label>
              <div className="relative">
                <Send className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@rotana_clinic"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              {isKh ? 'ជីវប្រវត្តិសង្ខេប ឬកំណត់ចំណាំ (Bio / Notes)' : 'Bio / Professional Notes'}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isKh ? 'ព័ត៌មានលម្អិតអំពីវេជ្ជបណ្ឌិត ឬការងារប្រចាំថ្ងៃ...' : 'Short clinical bio or daily duties...'}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-sans"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isKh ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] p-5 sm:p-6 space-y-4">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន (Current Password)' : 'Current Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'ពាក្យសម្ងាត់ថ្មី (New Password - យ៉ាងតិច 8 តួ)' : 'New Password (Min 8 characters)'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {isKh ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី (Confirm New Password)' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{isKh ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Update Password'}</span>
              </button>
            </div>
          </div>

          {/* Active Session & Device Sign Out */}
          <div className="pt-6 border-t border-[#E7E1D4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-stone-900">
                {isKh ? 'សម័យប្រជុំ និងការចាកចេញ (Active Session & Sign Out)' : 'Active Session & Sign Out'}
              </div>
              <div className="text-[11px] text-stone-500">
                {isKh
                  ? 'ចាកចេញពីគណនីលើឧបករណ៍នេះ ដើម្បីការពារសុវត្ថិភាពទិន្នន័យគ្លីនិក'
                  : 'Sign out of your account on this device to protect clinical records'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{isKh ? 'ចាកចេញពីប្រព័ន្ធ (Log Out)' : 'Sign Out of Device'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Preferences & Alerts */}
      {activeTab === 'preferences' && (
        <div className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] p-5 sm:p-6 space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E7E1D4]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    {isKh ? 'ភាសាប្រព័ន្ធ (System Language)' : 'Interface Language'}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {isKh ? 'ជ្រើសរើសភាសាខ្មែរ ឬភាសាអង់គ្លេស' : 'Switch between Khmer and English'}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setLocale('km')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    locale === 'km'
                      ? 'bg-teal-800 text-white border-teal-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  ខ្មែរ
                </button>
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    locale === 'en'
                      ? 'bg-teal-800 text-white border-teal-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E7E1D4]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    {isKh ? 'សំឡេងដាស់តឿន (Audio Chimes)' : 'Sound Effects & Chimes'}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {isKh ? 'សំឡេងពេលទទួលការទូទាត់ KHQR និងហៅលេខអ្នកជំងឺ' : 'Play sounds on payment success and queue calling'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 accent-teal-800 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E7E1D4]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    {isKh ? 'ការជូនដំណឹង (Push Notifications)' : 'Push Notifications'}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {isKh ? 'ទទួលដំណឹងពេលមានអ្នកជំងឺថ្មី ឬការទូទាត់ជោគជ័យ' : 'Receive alerts on new visits and invoice payments'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 accent-teal-800 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Role Permissions Inspection */}
      {activeTab === 'permissions' && (
        <div className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E1D4] pb-3">
            <div>
              <div className="text-xs font-bold text-stone-900">
                {isKh ? 'តារាងសិទ្ធិប្រើប្រាស់តាមតួនាទី (Role-Based Access Matrix)' : 'Role Permissions Matrix'}
              </div>
              <div className="text-[11px] text-stone-500">
                {isKh ? 'ពិនិត្យមើលថាតើតួនាទីរបស់អ្នកអាចចូលប្រើប្រាស់ម៉ូឌុលណាខ្លះ' : 'Modules you are allowed or restricted to access'}
              </div>
            </div>
            {isSuperAdmin && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                {isKh ? 'សិទ្ធិទាំងអស់ (Master Access)' : 'Unrestricted Access'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ROUTE_PERMISSIONS.map((perm) => {
              const allowed = isSuperAdmin || perm.allowedRoles.includes(user?.role as any);
              return (
                <div
                  key={perm.path}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    allowed
                      ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                      : 'bg-stone-100/50 border-stone-200/60 text-stone-400 opacity-60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {isKh ? perm.labelKh : perm.labelEn}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono truncate">
                      {perm.path}
                    </div>
                  </div>
                  {allowed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      <Check className="w-3 h-3" />
                      <span>{isKh ? 'អនុញ្ញាត' : 'Allowed'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold shrink-0">
                      <X className="w-3 h-3" />
                      <span>{isKh ? 'ចាក់សោ' : 'Locked'}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
