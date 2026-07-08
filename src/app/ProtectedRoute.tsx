import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
  permission?: string;
};

type Permiso =
  | string
  | {
      permiso: string;
    };

export default function ProtectedRoute({
  children,
  permission,
}: ProtectedRouteProps) {
  const rawUser = localStorage.getItem("presi2_auth");
  const token = localStorage.getItem("presi2_token");

  if (!rawUser || !token) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(rawUser) as {
    permisos?: Permiso[];
    permissions?: Permiso[];
  };

  const permissionsRaw = user.permisos ?? user.permissions ?? [];

  const permissions = permissionsRaw.map((permiso) =>
    typeof permiso === "string" ? permiso : permiso.permiso
  );

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}