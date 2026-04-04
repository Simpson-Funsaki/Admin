import {
  Folder,
  BookOpen,
  MessageSquare,
  ChartColumn,
  Server,
  Globe,
  Binary,
  Activity,
  FilePlay,
  LayoutDashboard,
  ListCheck,
  UserLock,
  Route,
  CloudCog,
  Brain,
} from "lucide-react";
import dynamic from "next/dynamic";

// Import your feature components
const EnhancedDashboard = dynamic(
  () => import("../features/dashboard/DashboardHome"),
  { ssr: false },
);
const ProjectManagerDashboard = dynamic(
  () => import("../features/ProjectManager/Project"),
  { ssr: false },
);
const BlogUpload = dynamic(
  () =>
    import("../features/BlogUpload/BlogUpload").then((m) => ({
      default: m.BlogUpload,
    })),
  { ssr: false },
);
const ContactResponse = dynamic(
  () => import("../features/PortfolioResponses/ContactResponse"),
  { ssr: false },
);
const WeeklyVisitsDashboard = dynamic(
  () => import("../features/VisitTracker/WeeklyVisitsDashboard"),
  { ssr: false },
);
const RenderServiceDashboard = dynamic(
  () => import("../features/Server/backendHealthCheck"),
  { ssr: false },
);
const Ipaddress = dynamic(() => import("../features/IpDatabase/Ipaddress"), {
  ssr: false,
});
const ConversionPage = dynamic(
  () => import("../features/BinaryConverter/ConversionPage"),
  { ssr: false },
);
const AniListViewer = dynamic(
  () => import("../features/anime-list/AniListViewer"),
  { ssr: false },
);
const DriveVideoPlayer = dynamic(
  () => import("../features/DVIDEO/videoPlayer"),
  { ssr: false },
);
const RBACManagement = dynamic(() => import("../features/RBAC/page"), {
  ssr: false,
});
const ActivitiesPage = dynamic(() => import("../features/Activity/activity"), {
  ssr: false,
});
const CombinedDashboard = dynamic(
  () => import("../features/routeDashboard/page"),
  { ssr: false },
);
const ApiKeyManagement = dynamic(() => import("../features/ApiKeys/page"), {
  ssr: false,
});
const OllamaPage = dynamic(() => import("../features/LLM/page"), {
  ssr: false,
});

export const adminFeatures = {
  dashboard: {
    title: "Dashboard",
    icon: LayoutDashboard,
    gradient: "from-purple-500 to-pink-500",
    component: EnhancedDashboard,
    roles: ["admin"],
    description: "Overview and analytics",
  },
  render: {
    title: "Server Status",
    icon: Server,
    gradient: "from-blue-500 to-purple-500",
    image:
      "https://res.cloudinary.com/dc1fkirb4/image/upload/v1763994657/render-dashboard_qyvptu.png",
    component: RenderServiceDashboard,
    roles: ["admin"],
    description: "Monitor backend services",
  },
  RBAC: {
    title: "RBAC",
    icon: UserLock,
    gradient: "from-pink-500 to-teal-500",
    component: RBACManagement,
    roles: ["admin"],
    description: "Role Based Access Control",
  },
  OLLAMA: {
    title: "OLLAMA",
    icon: Brain,
    gradient: "from-cyan-500 to-blue-500",
    component: OllamaPage,
    roles: ["admin"],
    description: "Chat With Local LLM",
  },
  activity: {
    title: "Recent Activities",
    icon: Activity,
    gradient: "from-indigo-500 to-blue-500",
    component: ActivitiesPage,
    roles: ["admin"],
    description: "Check Recent Activities",
  },
  projects: {
    title: "Manage Projects",
    icon: Folder,
    gradient: "from-blue-500 to-purple-500",
    image:
      "https://res.cloudinary.com/dc1fkirb4/image/upload/v1755754879/a1_cqsx8x.jpg",
    component: ProjectManagerDashboard,
    roles: ["admin"],
    description: "Upload and manage projects",
  },

  blog: {
    title: "Blog Upload",
    icon: BookOpen,
    gradient: "from-cyan-500 to-blue-500",
    image:
      "https://res.cloudinary.com/dc1fkirb4/image/upload/v1756037563/write-a-great-blog-post_ivsbz9.jpg",
    component: BlogUpload,
    roles: ["admin"],
    description: "Create and manage blog posts",
  },

  messages: {
    title: "View Messages",
    icon: MessageSquare,
    gradient: "from-indigo-500 to-blue-500",
    image:
      "https://res.cloudinary.com/dc1fkirb4/image/upload/v1755754879/a2_jjgzr3.png",
    component: ContactResponse,
    roles: ["admin"],
    description: "View contact form responses",
  },

  visitTracker: {
    title: "Track Portfolio Visits",
    icon: ChartColumn,
    gradient: "from-pink-500 to-teal-500",
    image:
      "https://res.cloudinary.com/dc1fkirb4/image/upload/v1765812000/17-what_cc424d55614b9ae928b5_vzjkj1.png",
    component: WeeklyVisitsDashboard,
    roles: ["admin"],
    description: "Analytics and visitor tracking",
  },
  routes: {
    title: "Routes",
    icon: Route,
    gradient: "from-purple-500 to-pink-500",
    component: CombinedDashboard,
    roles: ["admin"],
    description: "Routes Discovery",
  },

  ip: {
    title: "IP Addresses",
    icon: Globe,
    gradient: "from-green-500 to-teal-500",
    image:
      "https://res.cloudinary.com/dc1fkirb4/image/upload/v1761317160/ip-address-lookup_czcb34.jpg",
    component: Ipaddress,
    roles: ["admin"],
    description: "Track IP addresses",
  },

  converter: {
    title: "Binary Converter",
    icon: Binary,
    gradient: "from-pink-500 to-teal-500",
    image:
      "https://www.wikihow.com/images/thumb/9/96/Convert-from-Binary-to-Decimal-Step-4-Version-6.jpg/v4-460px-Convert-from-Binary-to-Decimal-Step-4-Version-6.jpg",
    component: ConversionPage,
    roles: ["admin", "viewer"],
    description: "Number system converter",
  },
  api: {
    title: "API Documentation",
    icon: CloudCog,
    gradient: "from-blue-500 to-purple-500",
    component: ApiKeyManagement,
    roles: ["admin"],
    description: "Api Keys for MicroServices",
  },
  alist: {
    title: "Anime List",
    icon: ListCheck,
    gradient: "from-cyan-500 to-blue-500",
    image: "",
    component: AniListViewer,
    roles: ["admin"],
    description: "Anime List from AniList",
  },
  dvideo: {
    title: "Drive Videos",
    icon: FilePlay,
    gradient: "from-indigo-500 to-blue-500",
    image: "",
    component: DriveVideoPlayer,
    roles: ["admin"],
    description: "Drive Playable Videos",
  },

  // notepad: {
  //   title: "Notepad",
  //   icon: FileText,
  //   gradient: "from-purple-500 to-pink-500",
  //   image: "https://res.cloudinary.com/dc1fkirb4/image/upload/v1755754879/a3_uutdd3.avif",
  //   component: Notepad,
  //   roles: ["admin", "editor"],
  //   description: "Personal note-taking",
  // },
};

// Helper to get features by role
export const getFeaturesByRole = (role) => {
  return Object.entries(adminFeatures)
    .filter(([_, feature]) => feature.roles.includes(role))
    .reduce((acc, [key, feature]) => ({ ...acc, [key]: feature }), {});
};
