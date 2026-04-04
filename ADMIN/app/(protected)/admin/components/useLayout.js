"use client";
import { usePathname, useRouter } from "next/navigation";
import { User, Settings, Bell } from "lucide-react";
import { useBackgroundContext } from "../../context/BackgroundContext";

export default function UserPageLayout({ children, username }) {
  const pathname = usePathname();
  const router = useRouter();

  const { theme, bgImage } = useBackgroundContext();

  const tabs = [
    { name: "Profile", path: "/admin/user/profile", icon: User },
    { name: "Settings", path: "/admin/user/settings", icon: Settings },
  ];

  const isActiveTab = (path) => pathname === path;
  const isDark = theme === "dark";

  const backBtnBg = isDark ? "bg-white/10 backdrop-blur-md" : "bg-white/80 backdrop-blur-md";
  const backBtnHover = isDark ? "hover:bg-purple-600 hover:text-white" : "hover:bg-purple-500 hover:text-white";
  const backBtnText = isDark ? "text-gray-300" : "text-gray-700";
  const activeTabBg = isDark ? "bg-purple-600" : "bg-purple-500";
  const inactiveTabText = isDark ? "text-gray-400" : "text-gray-600";
  const inactiveTabHover = isDark
    ? "hover:text-white hover:bg-white/10"
    : "hover:text-gray-900 hover:bg-purple-100";

  const fallbackGradient = isDark
    ? "from-slate-950 via-purple-950 to-slate-950"
    : "from-blue-50 via-purple-50 to-pink-50";

  return (
    <div
      className={`min-h-screen relative transition-all duration-500 ${
        !bgImage ? `bg-gradient-to-br ${fallbackGradient}` : ""
      }`}
      style={
        bgImage
          ? {
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
            }
          : undefined
      }
    >
      {/* Tint overlay over image */}
      {bgImage && (
        <div
          className={`fixed inset-0 pointer-events-none transition-colors duration-300 ${
            isDark ? "bg-black/40" : "bg-white/20"
          }`}
        />
      )}

      {/* ✅ Transparent sticky header */}
      <div
        className={`sticky top-0 z-20 backdrop-blur-xl border-b transition-colors duration-300 ${
          isDark
            ? "bg-white/5 border-white/10"
            : "bg-white/30 border-purple-200/40"
        }`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="relative flex items-center justify-center">
            {/* Back button — absolutely positioned left */}
            <div className="absolute left-0">
              <button
                className={`flex items-center gap-2 px-5 py-2 whitespace-nowrap transition-all duration-200 rounded-lg ${backBtnBg} ${backBtnText} ${backBtnHover} cursor-pointer font-medium text-sm`}
                onClick={() => router.push("/admin")}
              >
                ← Back
              </button>
            </div>

            {/* Tabs — centered */}
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = isActiveTab(tab.path);
                return (
                  <button
                    key={tab.path}
                    onClick={() => router.push(tab.path)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 whitespace-nowrap
                      transition-all duration-200 rounded-lg font-medium text-sm
                      ${
                        isActive
                          ? `text-white ${activeTabBg} shadow-lg`
                          : `${inactiveTabText} ${inactiveTabHover}`
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Page Content — z-10 so it stays above the tint overlay */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}