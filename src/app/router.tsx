import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import Splash from "@/modules/auth/pages/Splash";
import Login from "@/modules/auth/pages/Login";
import ActivarCuentaPage from "@/modules/verificarCorreo/ActivarCuentaPage";
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
    path: "/activar",
    element: <ActivarCuentaPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute permission="dashboard.view">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "apoyos/registro",
        element: (
          <ProtectedRoute permission="apoyos.create">
            <RegistroApoyoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "apoyos/historial",
        element: (
          <ProtectedRoute permission="apoyos.history">
            <HistorialApoyosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "comunidades",
        element: (
          <ProtectedRoute permission="comunidades.view">
            <ComunidadesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "fondos",
        element: (
          <ProtectedRoute permission="fondos.view">
            <FondosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "administracion/usuarios",
        element: (
          <ProtectedRoute permission="usuarios.view">
            <UsuariosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "administracion/roles",
        element: (
          <ProtectedRoute permission="roles.view">
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "administracion/permisos",
        element: (
          <ProtectedRoute permission="permisos.view">
            <PermisosPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);