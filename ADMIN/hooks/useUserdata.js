import { useState, useEffect, useCallback, useRef } from "react";
import useApi from "@/services/authservices";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dc1fkirb4/image/upload/v1756140468/cropped_circle_image_dhaq8x.png";

export default function useUserProfile(options = {}) {
  const { fetchOnMount = true, includeImage = true } = options;

  const [userProfile, setUserProfile]   = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const apiFetch   = useApi();
  const hasFetched = useRef(false);     // blocks StrictMode double-fire
  const isMounted  = useRef(true);      // blocks setState after unmount

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ─── helpers ──────────────────────────────────────────────────────────────
  const resolveImage = (avatarUrl) =>
    avatarUrl || DEFAULT_AVATAR;

  const normalizeProfile = (userData, preferences) => {
    const hasAdminRole = userData.userRoles?.some(
      (ur) => ur.role?.slug === "admin",
    );
    const roleSlug = hasAdminRole
      ? "admin"
      : (userData.userRoles?.[0]?.role?.slug ?? "user");
    const roleName = hasAdminRole
      ? "Admin"
      : (userData.userRoles?.[0]?.role?.name ?? "User");

    return {
      username:          userData.fullName?.trim().split(/\s+/)[0] || "",
      userId:            userData.id,
      fullName:          userData.fullName || userData.username || "",
      email:             userData.email || "",
      phone:             userData.phoneNumber,
      location:          userData.location,
      bio:               userData.bio,
      joinedDate:        userData.createdAt
        ? new Date(userData.createdAt).toLocaleDateString("en-US", {
            month: "long", year: "numeric",
          })
        : "Unknown",
      lastLogin:         userData.lastLoginAt
        ? new Date(userData.lastLoginAt).toLocaleDateString()
        : "Unknown",
      role:              roleName,
      roleSlug,
      avatar:            userData.avatarUrl || "",
      theme:             preferences.theme,
      language:          preferences.language,
      notifications:     preferences.pushNotifications,
      emailAlerts:       preferences.emailNotifications,
      profileVisibility: preferences.visibility,
    };
  };

  const normalizeUpdatedProfile = (raw) => ({
    id:        raw.id,
    email:     raw.email,
    username:  raw.username,
    fullName:  raw.fullName,
    phone:     raw.phoneNumber,
    bio:       raw.bio,
    location:  raw.location,
    avatar:    raw.avatarUrl,
    role:      raw.userRoles?.[0]?.role?.slug,
    isActive:  raw.isActive,
    lastLogin: raw.lastLoginAt,
  });

  const normalizeSettings = (raw) => ({
    language:          raw.language,
    theme:             raw.theme,
    notifications:     raw.pushNotifications,
    emailAlerts:       raw.emailNotifications,
    profileVisibility: raw.visibility,
  });

  // ─── fetch ────────────────────────────────────────────────────────────────
  const fetchUserProfile = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      setLoading(true);
      setError(null);

      const [profileRes, settingsRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/profile`),
        apiFetch(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/preferences`),
      ]);

      if (!profileRes.ok || !settingsRes.ok) {
        throw new Error("Failed to fetch user data");
      }

      const profileJson     = await profileRes.json();
      const preferencesJson = await settingsRes.json();

      const userData    = profileJson.data;
      const preferences = preferencesJson.data;

      if (!userData)    throw new Error("Invalid profile response structure");
      if (!preferences) throw new Error("Invalid preferences response structure");

      const mapped = normalizeProfile(userData, preferences);

      if (!isMounted.current) return;

      setUserProfile(mapped);

      if (includeImage) {
        setProfileImage(resolveImage(mapped.avatar));
      }

      return mapped;
    } catch (err) {
      console.error("[useUserProfile] fetch failed:", err);
      if (isMounted.current) setError(err.message || "Something went wrong");
      throw err;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  // apiFetch ref is stable from useCallback in context — safe to include
  }, [apiFetch, includeImage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── update profile + preferences ─────────────────────────────────────────
  const updateUserProfile = useCallback(async (updates) => {
    try {
      const hasProfileChange = !!(
        updates?.username  ||
        updates?.fullName  ||
        updates?.email     ||
        updates?.phone     ||
        updates?.location  ||
        updates?.bio
      );

      const hasPreferenceChange = !!(
        updates?.NewTheme              ||
        updates?.profileVisibility     ||
        updates?.notifications !== undefined ||
        updates?.emailAlerts   !== undefined
      );

      const requests = [];

      if (hasProfileChange) {
        requests.push(
          apiFetch(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/profile/update`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username:    updates.username,
              email:       updates.email,
              fullName:    updates.fullName,
              bio:         updates.bio,
              phoneNumber: updates.phone,
              location:    updates.location,
            }),
          }),
        );
      }

      if (hasPreferenceChange) {
        requests.push(
          apiFetch(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/setting/update`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              theme:              updates.NewTheme,
              visibility:         updates.profileVisibility,
              pushNotifications:  updates.notifications,
              emailNotifications: updates.emailAlerts,
            }),
          }),
        );
      }

      if (!requests.length) {
        console.warn("[useUserProfile] updateUserProfile: no changes detected");
        return userProfile;
      }

      const results = await Promise.all(requests);

      if (results.some((r) => !r.ok)) {
        throw new Error("One or more updates failed");
      }

      const jsons = await Promise.all(results.map((r) => r.json()));

      let profileData  = null;
      let settingsData = null;
      let idx = 0;

      if (hasProfileChange)    profileData  = normalizeUpdatedProfile(jsons[idx++].data);
      if (hasPreferenceChange) settingsData = normalizeSettings(jsons[idx].data);

      const merged = { ...userProfile, ...profileData, ...settingsData };

      if (isMounted.current) setUserProfile(merged);
      return merged;
    } catch (err) {
      console.error("[useUserProfile] update failed:", err.message);
      throw err;
    }
  }, [apiFetch, userProfile]);

  // ─── update image ─────────────────────────────────────────────────────────
  const updateProfileImage = useCallback(async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append("profilePic", imageBlob, "profile.jpg");

      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/setting/image/update`,
        { method: "POST", body: formData },
      );

      if (!res.ok) throw new Error("Image upload failed");

      const data = await res.json();
      const imageUrl = data?.imageUrl ?? data?.data?.imageUrl ?? null;

      if (imageUrl && isMounted.current) {
        setProfileImage(imageUrl);
        setUserProfile((prev) => prev ? { ...prev, avatar: imageUrl } : prev);
      }

      return imageUrl;
    } catch (err) {
      console.error("[useUserProfile] image upload failed:", err);
      throw err;
    }
  }, [apiFetch]);

  // ─── mount effect — fires exactly once ───────────────────────────────────
  useEffect(() => {
    if (!fetchOnMount) return;
    if (hasFetched.current) return;   // blocks StrictMode second invocation
    hasFetched.current = true;

    fetchUserProfile().catch(() => {
      // error already set in state, no need to rethrow here
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    userProfile,
    profileImage,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile,
    updateProfileImage,
    refreshProfile: fetchUserProfile,   // alias — same function
    setUserProfile,
    setProfileImage,
  };
}