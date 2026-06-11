import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Splash from "@/modules/auth/pages/Splash";
import Login from "@/modules/auth/pages/Login";
import DashboardPage from "@/modules/dashboard/DashboardPage";
import RegistroApoyoPage from "@/modules/apoyos/registro/RegistroApoyoPage";
import HistorialApoyosPage from "@/modules/apoyos/historial/HistorialApoyosPage";
import ComunidadesPage from "@/modules/comunidades/ComunidadesPage";
import FondosPage from "@/modules/fondos/FondosPage";
import RolesPage from "@/modules/administracion/roles/RolesPage";
import PermisosPage from "@/modules/administracion/permisos/PermisosPage";
import UsuariosPage from "@/modules/administracion/usuarios/UsuariosPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Splash />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
  path: "dashboard",
  element: <DashboardPage />,
},
{
  path: "apoyos/registro",
  element: <RegistroApoyoPage />,
},
{
  path: "apoyos/historial",
  element: <HistorialApoyosPage />,
},
{
  path: "comunidades",
  element: <ComunidadesPage />,
},
{
  path: "fondos",
  element: <FondosPage />,
},
{
  path: "administracion/usuarios",
  element: <UsuariosPage />,
},
{
  path: "administracion/roles",
  element: <RolesPage />,
},
{
  path: "administracion/permisos",
  element: <PermisosPage />,
},
    ],
  },
]);
