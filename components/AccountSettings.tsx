import React, { useState } from "react";
import { Toast, ToastType } from "./Toast";
import { apiChangePassword, apiLogout } from "../utils/api";

interface AccountSettingsProps {
  userEmail: string | null;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ userEmail }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      // Remove any local tokens/storage you might have
      localStorage.removeItem("zenbill_auth_token");
      sessionStorage.clear();
      window.location.href = "/login";
    } catch (e) {
      window.location.href = "/login";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    setIsLoading(true);
    try {
      await apiChangePassword({ oldPassword, newPassword });
      showToast("Password changed successfully", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err?.message || "Failed to change password. Please check your old password.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} duration={4000} />

      <div>
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
        <p className="text-gray-500 mt-1">Manage your account security and authentication.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Info Section */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 tracking-tight">Signed in as</p>
              <p className="text-sm text-gray-500">{userEmail || "Admin User"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
          >
            Log Out
          </button>
        </div>

        {/* Change Password Section */}
        <div className="p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Change Password</h3>
          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                placeholder="Confirm your new password"
              />
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
                  isLoading || !oldPassword || !newPassword || !confirmPassword
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};