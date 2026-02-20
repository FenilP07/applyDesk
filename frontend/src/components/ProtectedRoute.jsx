import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, booting } = useAuthStore();

  if (booting) {
    return <div className="p-6 text-sm text-gray-500">Checking session…</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}