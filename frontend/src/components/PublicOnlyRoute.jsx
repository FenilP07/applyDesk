import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, booting } = useAuthStore();

  if (booting) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
}