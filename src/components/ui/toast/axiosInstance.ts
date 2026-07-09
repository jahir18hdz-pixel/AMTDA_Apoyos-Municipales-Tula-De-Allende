// axiosInstance.ts
import axios from "axios";
import { notifySuccess, notifyError } from "./toastBridge";
import { getToastMessage } from "./getToastMessage";

const api = axios.create({ baseURL: "/api" });

// Métodos que consideramos "acciones" (no queremos toast en cada GET)
const ACTION_METHODS = ["post", "put", "patch", "delete"];

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();

    if (method && ACTION_METHODS.includes(method)) {
      const mensaje = response.data?.mensaje ?? "Operación realizada correctamente";
      notifySuccess(mensaje);
    }

    return response;
  },
  (error) => {
    notifyError(getToastMessage(error));
    return Promise.reject(error);
  }
);

export default api;