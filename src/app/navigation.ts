import {
  LayoutDashboard,
  HandHelping,
  History,
  Building2,
  Wallet,
} from "lucide-react";

export const navigationItems = [
  {
    id: "dashboard.view",
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    id: "apoyos.create",
    title: "Registrar Apoyo",
    path: "/apoyos/registro",
    icon: HandHelping,
  },
  {
    id: "apoyos.history",
    title: "Historial",
    path: "/apoyos/historial",
    icon: History,
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
] as const;