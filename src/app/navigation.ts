import {
  LayoutDashboard,
  HandHelping,
  Building2,
  Wallet,
  FileBarChart,
} from "lucide-react";

export const navigationItems = [
  {
    id: "dashboard.view",
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "apoyos.create",
    title: "Apoyos",
    path: "/apoyos/registro",
    icon: HandHelping,
  },
  {
    id: "comunidades.view",
    title: "Comunidades",
    path: "/comunidades",
    icon: Building2,
  },
  {
    id: "fondos.view",
    title: "Fondos",
    path: "/fondos",
    icon: Wallet,
  },
  {
    id: "reportes.view",
    title: "Reportes",
    path: "/reportes",
    icon: FileBarChart,
  },
] as const;