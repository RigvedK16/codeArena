import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { clearUser, setUser } from "../redux/authSlice";

export default function RequireAuth({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();
  const location = useLocation();

  const [status, setStatus] = useState(isAuthenticated ? "authed" : "checking");

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (isAuthenticated) {
        setStatus("authed");
        return;
      }

      setStatus("checking");
      try {
        const user = await api("/profile");
        if (cancelled) return;
        dispatch(setUser(user));
        setStatus("authed");
      } catch {
        if (cancelled) return;
        dispatch(clearUser());
        setStatus("unauth");
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated]);

  if (status === "checking") return null;

  if (status === "unauth") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
