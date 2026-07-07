import { api } from "./api";

export type LoginDto = {
  correo: string;
  password: string;
};

export type RecuperarPasswordDto = {
  correo: string;
};

export type ResetPasswordDto = {
  token: string;
  nuevoPassword: string;
};

export type LoginResponse = {
  token: string;
  usuario?: {
    id: string;
    nombre: string;
    correo: string;
    rolId?: string;
    rolNombre?: string;
    permisos?: string[];
  };
};

export async function login(dto: LoginDto) {
  const response = await api.post<LoginResponse>("/auth/login", dto);
  return response.data;
}

export async function recuperarPassword(dto: RecuperarPasswordDto) {
  const response = await api.post<{ mensaje: string }>(
    "/auth/recuperar-password",
    dto
  );

  return response.data;
}

export async function resetPassword(dto: ResetPasswordDto) {
  const response = await api.post<{ mensaje: string }>(
    "/auth/reset-password",
    dto
  );

  return response.data;
}