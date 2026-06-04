import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { User, Office, Token, Role, Priority, TokenStatus } from "../types";

const useGlobalPullToRefresh = (refreshFn: () => Promise<void>) => {
  useEffect(() => {
    let startY = 0;
    let pulling = false;
    let threshold = 80;
    let indicator = document.getElementById("ptr-indicator");

    const onStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (!pulling || !indicator) return;
      const diff = e.touches[0].clientY - startY;
      if (diff > 0 && diff < threshold) {
        indicator.style.opacity = "1";
        indicator.style.transform = `translateY(${diff / 2}px)`;
      }
      if (diff > threshold) {
        pulling = false;
        indicator.style.transform = `translateY(60px)`;
        indicator.style.opacity = "1";
        refreshFn().then(() => {
          setTimeout(() => {
            if (!indicator) return;
            indicator.style.opacity = "0";
            indicator.style.transform = "translateY(0px)";
          }, 500);
        });
      }
    };

    const onEnd = () => {
      pulling = false;
      if (indicator) {
        indicator.style.opacity = "0";
        indicator.style.transform = "translateY(0px)";
      }
    };

    document.addEventListener("touchstart", onStart);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onEnd);

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [refreshFn]);
};

// API & SOCKET CLIENT
const getBackendUrl = () => {
  const viteUrl = (import.meta as any).env.VITE_API_URL;
  if (viteUrl) return viteUrl;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocalHost = /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(hostname);

  if (isLocalHost) {
    return `http://${hostname}:5000`;
  }
  return "https://klsmartq.onrender.com";
};

const SOCKET_URL = getBackendUrl();
const API_URL = `${SOCKET_URL}/api`;

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kl_smartq_jwt");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const socket = io(SOCKET_URL);

interface AppNotification {
  userId: string;
  message: string;
  id: number;
}

interface AppContextType {
  session: string | null;
  currentUser: User | null;
  users: User[];
  offices: Office[];
  tokens: Token[];
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<any>;
  ssoLogin: (email: string, name: string, role: string) => Promise<any>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  verifySignupOtp: (email: string, otp: string) => Promise<any>;
  resendSignupOtp: (email: string) => Promise<any>;
  checkEmailAvailability: (email: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  submitPasswordReset: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  resendVerificationOtp: (email: string) => Promise<any>;
  verifyEmailOtp: (email: string, otp: string) => Promise<any>;

  bookToken: (officeId: string, purpose: string, priority: Priority) => Promise<void>;
  callNextToken: (officeId: string) => Promise<void>;
  completeToken: (tokenId: string) => Promise<void>;

  addOffice: (office: any) => Promise<void>;
  setupOffice: (name: string, prefix: string) => Promise<any>;
  updateOffice: (office: Office) => Promise<void>;
  deleteOffice: (officeId: string) => Promise<void>;

  addUser: (user: any) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  checkInStudent: (tokenId: string) => Promise<void>;
  scanOfficeQr: (studentId: string, officeId: string) => Promise<void>;
  clearNotification: (id: number) => void;
  isQueueEmpty: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const formatToken = (t: any): Token => ({
  id: t.id,
  tokenNumber: t.token_number,
  studentId: t.student_id,
  officeId: t.office_id,
  purpose: t.purpose,
  priority: t.priority,
  status: t.status,
  createdAt: new Date(t.created_at),
  calledAt: t.called_at ? new Date(t.called_at) : undefined,
  completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
  isCheckedIn: t.is_checked_in,
  student: t.student ? { name: t.student.full_name, universityId: t.student.university_id } : undefined
});

const formatOfficeFromDB = (o: any): Office => ({
  id: o.id,
  name: o.name,
  operatingHours: o.operating_hours,
  tokenLimit: o.token_limit,
  isActive: o.is_active,
  prefix: o.prefix
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<string | null>(localStorage.getItem("kl_smartq_jwt"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserRef = useRef<User | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const isQueueEmpty = tokens.filter(
    (t) => t.status === TokenStatus.WAITING || t.status === TokenStatus.IN_PROGRESS
  ).length === 0;

  const loadData = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const ssoEmail = params.get('email');
    if (ssoEmail) {
      try {
        const { data } = await api.post("/auth/sso", { 
          email: ssoEmail, 
          name: params.get('name'), 
          role: params.get('role') 
        });
        localStorage.setItem("kl_smartq_jwt", data.token);

        // Preserve office parameters for auto-setup before clearing URL
        const officeName = params.get('officeName');
        const cabinNumber = params.get('cabinNumber');
        if (officeName && cabinNumber) {
          localStorage.setItem("kl_smartq_sso_office", officeName);
          localStorage.setItem("kl_smartq_sso_cabin", cabinNumber);
        }

        window.history.replaceState({}, document.title, window.location.pathname);
        setSession(data.token);
        return; // Early return, changing session will trigger loadData again
      } catch (err) {
        console.error("SSO Error:", err);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    if (!session) {
      setCurrentUser(null);
      setUsers([]);
      setOffices([]);
      setTokens([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data: { user } } = await api.get("/auth/me");
      
      const userProfile: User = {
        id: user.id,
        name: user.full_name,
        email: user.email,
        universityId: user.university_id,
        role: user.role,
        assignedOfficeIds: user.assigned_office_ids ?? []
      };

      currentUserRef.current = userProfile;
      setCurrentUser(userProfile);

      const [officesRes, tokensRes, notifRes, usersRes] = await Promise.all([
        api.get("/offices"),
        api.get("/tokens"),
        api.get("/notifications"),
        userProfile.role === Role.ADMIN ? api.get("/users") : Promise.resolve({ data: [] })
      ]);

      setOffices(officesRes.data.map(formatOfficeFromDB));
      setTokens(tokensRes.data.map(formatToken));
      setNotifications(notifRes.data.map((n: any) => ({
        id: n.id, message: n.message, userId: n.user_id
      })));
      
      setUsers(usersRes.data.map((u: any) => ({
        id: u.id, name: u.full_name, email: u.email, universityId: u.university_id,
        role: u.role, assignedOfficeIds: u.assigned_office_ids
      })));

      setLoading(false);
    } catch (err: any) {
      console.error("Startup error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("kl_smartq_jwt");
        setSession(null);
      }
      setError(err.message);
      setLoading(false);
    }
  }, [session]);

  const refreshTokens = useCallback(async () => {
    if (!session) return;
    try {
      const { data } = await api.get("/tokens");
      setTokens(data.map(formatToken));
    } catch (err) {
      console.warn("Token refresh error:", err);
    }
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!session) return;

    socket.on("token_created", (newToken) => {
      setTokens((prev) => [...prev, formatToken(newToken)]);
    });

    socket.on("token_updated", (updatedToken) => {
      setTokens((prev) => prev.map((t) => t.id === updatedToken.id ? formatToken(updatedToken) : t));
    });

    socket.on("notification_created", (notif) => {
      if (notif.user_id === currentUserRef.current?.id) {
        setNotifications((prev) => [...prev, { id: notif.id, message: notif.message, userId: notif.user_id }]);
        refreshTokens();
      }
    });

    socket.on("user_created", (u) => setUsers((prev) => [...prev, u]));
    socket.on("user_updated", (u) => {
      setUsers((prev) => prev.map(x => x.id === u.id ? u : x));
      if (currentUserRef.current?.id === u.id) {
        setCurrentUser(u);
        currentUserRef.current = u;
        refreshTokens();
      }
    });
    socket.on("user_deleted", (id) => setUsers((prev) => prev.filter(x => x.id !== id)));

    socket.on("office_created", (o) => setOffices((prev) => [...prev, o]));
    socket.on("office_updated", (o) => setOffices((prev) => prev.map(x => x.id === o.id ? o : x)));
    socket.on("office_deleted", (id) => setOffices((prev) => prev.filter(x => x.id !== id)));

    return () => {
      socket.off("token_created");
      socket.off("token_updated");
      socket.off("notification_created");
      socket.off("user_created");
      socket.off("user_updated");
      socket.off("user_deleted");
      socket.off("office_created");
      socket.off("office_updated");
      socket.off("office_deleted");
    };
  }, [session, refreshTokens]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("kl_smartq_jwt", data.token);
      setSession(data.token);
      return { success: true, message: "Logged in successfully" };
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.error || err.message,
        code: err.response?.data?.code
      };
    }
  };

  const ssoLogin = async (email: string, name: string, role: string) => {
    try {
      const { data } = await api.post("/auth/sso", { email, name, role });
      localStorage.setItem("kl_smartq_jwt", data.token);
      setSession(data.token);
      return { success: true, message: "SSO login successful" };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
    }
  };

  const checkEmailAvailability = async (email: string) => {
    return { available: true, message: "Checked" }; // Mocked for now
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/signup", { name, email, password });
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
    }
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp, type: "SIGNUP" });
      localStorage.setItem("kl_smartq_jwt", data.token);
      setSession(data.token);
      return { success: true, message: "Email verified successfully!" };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
    }
  };

  const resendSignupOtp = async (email: string) => {
    try {
      await api.post("/auth/send-otp", { email, type: "SIGNUP" });
      return { success: true, message: "Verification OTP resent." };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
    }
  };

  const logout = async () => {
    localStorage.removeItem("kl_smartq_jwt");
    setSession(null);
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await api.post("/auth/send-otp", { email, type: "RESET_PASSWORD" });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
    }
  };

  const submitPasswordReset = async (email: string, otp: string, newPassword: string) => {
    try {
      const { data } = await api.post("/auth/reset-password", { email, otp, newPassword });
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
    }
  };

  const resendVerificationOtp = async (email: string) => {
    return resendSignupOtp(email);
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    return verifySignupOtp(email, otp);
  };

  const bookToken = async (officeId: string, purpose: string, priority: Priority) => {
    await api.post("/tokens", { office_id: officeId, purpose, priority });
  };

  const callNextToken = async (officeId: string) => {
    // Current student being served (if any)
    const current = tokens.find(
      (t) => t.officeId === officeId && t.status === TokenStatus.IN_PROGRESS
    );

    // Next student in queue (WAITING)
    const officeTokens = tokens.filter((t) => t.officeId === officeId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const next = officeTokens.find(
      (t) => t.status === TokenStatus.WAITING
    );

    if (!next) throw new Error("No waiting students");

    if (current) {
      await api.put(`/tokens/${current.id}`, { status: "COMPLETED" });
    }

    await api.post("/notifications", { user_id: next.studentId, message: "You're next! Please scan the office QR to start your turn." });
  };

  const completeToken = async (tokenId: string) => {
    await api.put(`/tokens/${tokenId}`, { status: "COMPLETED" });
  };

  const checkInStudent = async (tokenId: string) => {
    await api.put(`/tokens/${tokenId}`, { is_checked_in: true });
  };

  const scanOfficeQr = async (studentId: string, officeId: string) => {
    const officeTokens = tokens
      .filter((t) => t.officeId === officeId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const waitingList = officeTokens.filter((t) => t.status === TokenStatus.WAITING);
    const inProgressToken = officeTokens.find((t) => t.status === TokenStatus.IN_PROGRESS);
    const nextWaiting = waitingList[0];

    if (inProgressToken && inProgressToken.studentId !== studentId) {
      throw new Error("Another student is currently being served. Please wait.");
    }
    if (!nextWaiting || nextWaiting.studentId !== studentId) {
      throw new Error("You are not next in queue. Please wait for your turn.");
    }

    await api.put(`/tokens/${nextWaiting.id}`, { status: "IN_PROGRESS", is_checked_in: true });

    // notify next
    const nextAfter = waitingList[1];
    if (nextAfter) {
      await api.post("/notifications", { user_id: nextAfter.studentId, message: "Get ready! You are next. Estimated time: 3 minutes." });
    }
  };

  const addOffice = async (office: any) => {
    await api.post("/admin/offices", office);
  };
  const setupOffice = async (name: string, prefix: string) => {
    try {
      const { data } = await api.post("/offices/setup", { name, prefix });
      
      // Update local context
      setOffices((prev) => [...prev, data.office]);
      if (currentUserRef.current) {
        const updatedUser = { 
          ...currentUserRef.current, 
          assignedOfficeIds: [...(currentUserRef.current.assignedOfficeIds || []), data.office.id] 
        };
        setCurrentUser(updatedUser);
        currentUserRef.current = updatedUser;
      }
      
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
    }
  };
  const updateOffice = async (office: Office) => {
    await api.put(`/admin/offices/${office.id}`, office);
  };
  const deleteOffice = async (officeId: string) => {
    await api.delete(`/admin/offices/${officeId}`);
  };
  const addUser = async (user: any) => {
    await api.post("/admin/users", user);
  };
  const updateUser = async (user: User) => {
    await api.put(`/admin/users/${user.id}`, user);
  };
  const deleteUser = async (userId: string) => {
    await api.delete(`/admin/users/${userId}`);
  };

  const clearNotification = async (notificationId: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const value = useMemo(
    () => ({
      session,
      currentUser,
      users,
      offices,
      tokens,
      notifications,
      loading,
      error,
      login,
      ssoLogin,
      signup,
      logout,
      verifySignupOtp,
      resendSignupOtp,
      checkEmailAvailability,
      requestPasswordReset,
      submitPasswordReset,
      resendVerificationOtp,
      verifyEmailOtp,
      bookToken,
      callNextToken,
      completeToken,
      addOffice,
      setupOffice,
      updateOffice,
      deleteOffice,
      addUser,
      updateUser,
      deleteUser,
      checkInStudent,
      scanOfficeQr,
      clearNotification,
      isQueueEmpty
    }),
    [session, currentUser, users, offices, tokens, notifications, loading, error, isQueueEmpty]
  );

  useGlobalPullToRefresh(async () => {
    console.log("🔄 Pull-to-refresh triggered");
    await refreshTokens();
  });

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};
