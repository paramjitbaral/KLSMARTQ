// PART 1/4 ---------------------------------------------------------------

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
  useRef,
  useCallback
} from "react";

import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";
import {
  User,
  Office,
  Token,
  Role,
  Priority,
  TokenStatus
} from "../types";
/* -------------------------------------------------------
   GLOBAL PULL-TO-REFRESH WITH ANIMATION
------------------------------------------------------- */
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
// -------------------------------------------------------
// SUPABASE CLIENT
// -------------------------------------------------------
const SUPABASE_URL = "https://awgnkxruzfljbhvvomlg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3Z25reHJ1emZsamJodnZvbWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDA2NzgsImV4cCI6MjA3NzkxNjY3OH0.tYhu129xg5NvyZwq0g7391ub6hpA3ri2cVYxYukR3gQ";

const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// -------------------------------------------------------
// NOTIFICATION INTERFACE
// -------------------------------------------------------
interface AppNotification {
  userId: string;
  message: string;
  id: number;
}

// -------------------------------------------------------
// APP CONTEXT INTERFACE
// -------------------------------------------------------
interface AppContextType {
  supabase: SupabaseClient;
  session: Session | null;
  currentUser: User | null;

  users: User[];
  offices: Office[];
  tokens: Token[];
  notifications: AppNotification[];

  loading: boolean;
  error: string | null;

  // Auth
  login: (email: string, password: string) => Promise<any>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  verifySignupOtp: (email: string, otp: string) => Promise<any>;
  resendSignupOtp: (email: string) => Promise<any>;
  checkEmailAvailability: (email: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendVerificationOtp: (email: string) => Promise<any>;
  verifyEmailOtp: (email: string, otp: string) => Promise<any>;

  // Token operations
  bookToken: (
    officeId: string,
    purpose: string,
    priority: Priority
  ) => Promise<void>;
  callNextToken: (officeId: string) => Promise<void>;
  completeToken: (tokenId: string) => Promise<void>;

  // Office operations
  addOffice: (office: any) => Promise<void>;
  updateOffice: (office: Office) => Promise<void>;
  deleteOffice: (officeId: string) => Promise<void>;

  // User operations
  addUser: (user: any) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Scanning
  checkInStudent: (tokenId: string) => Promise<void>;
  scanOfficeQr: (studentId: string, officeId: string) => Promise<void>;

  // Notification
  clearNotification: (id: number) => void;

  // Empty Queue Logic
  isQueueEmpty: boolean;
}

// -------------------------------------------------------
// CREATE CONTEXT
// -------------------------------------------------------
const AppContext = createContext<AppContextType | undefined>(undefined);

// -------------------------------------------------------
// TOKEN FORMATTERS
// -------------------------------------------------------
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
  student: t.profiles
    ? {
        name: t.profiles.full_name,
        universityId: t.profiles.university_id
      }
    : undefined
});

// -------------------------------------------------------
// OFFICE FORMATTERS
// -------------------------------------------------------
const formatOfficeFromDB = (o: any): Office => ({
  id: o.id,
  name: o.name,
  operatingHours: o.operating_hours,
  tokenLimit: o.token_limit,
  isActive: o.is_active,
  prefix: o.prefix
});

// -------------------------------------------------------
// PROVIDER START
// -------------------------------------------------------

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time safe reference
  const currentUserRef = useRef<User | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // -------------------------------------------------------
  // EMPTY QUEUE LOGIC (Option A)
  // -------------------------------------------------------
  const isQueueEmpty = tokens.filter(
    (t) =>
      t.status === TokenStatus.WAITING ||
      t.status === TokenStatus.IN_PROGRESS
  ).length === 0;

  // -------------------------------------------------------
  // REFRESH TOKENS HELPER
  // -------------------------------------------------------
  const refreshTokens = useCallback(async () => {
    if (!session) return;
    const user = currentUserRef.current;
    if (!user) return;

    const queryStr = "*, profiles(full_name, university_id)";
    let query = supabase.from("tokens").select(queryStr);

    if (user.role === Role.STUDENT) {
      query = query.eq("student_id", user.id);
    } else if (user.role === Role.STAFF) {
      if (!user.assignedOfficeIds?.length) {
        setTokens([]);
        return;
      }
      query = query.in("office_id", user.assignedOfficeIds);
    }

    const { data, error } = await query;
    if (error) return console.warn("Token refresh error:", error.message);

    setTokens(data.map(formatToken));
  }, [session]);

// PART 1/4 END ---------------------------------------------------------------
// PART 2/4 ---------------------------------------------------------------

// -------------------------------------------------------
// LOAD SESSION + INITIAL DATA
// -------------------------------------------------------
useEffect(() => {
  let mounted = true;
  let timeoutId: NodeJS.Timeout | null = null;

  const loadSession = async (s: Session | null) => {
    if (!mounted) return;

    setSession(s);

    if (!s) {
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

      // Timeout guard
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              "Database timeout. Please check your internet connection."
            )
          );
        }, 15000);
      });

      // Fetch user profile
      const profileResult: any = await Promise.race([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", s.user.id)
          .single(),
        timeoutPromise
      ]);

      if (profileResult.error)
        throw new Error("Failed to fetch profile: " + profileResult.error.message);

      const p = profileResult.data;

      const userProfile: User = {
        id: p.id,
        name: p.full_name,
        email: p.email,
        universityId: p.university_id,
        role: p.role,
        assignedOfficeIds: p.assigned_office_ids ?? []

      };

      currentUserRef.current = userProfile;
      setCurrentUser(userProfile);

      if (timeoutId) clearTimeout(timeoutId);

      // -------------------------------------------------------
      // LOAD DATA IN PARALLEL
      // -------------------------------------------------------
      const tokenQuery = "*, profiles(full_name, university_id)";
      let tokensPromise;
      let usersPromise;

      if (userProfile.role === Role.STUDENT) {
        tokensPromise = supabase
          .from("tokens")
          .select(tokenQuery)
          .eq("student_id", userProfile.id);
        usersPromise = Promise.resolve({ data: [], error: null });
      } else if (userProfile.role === Role.STAFF) {
        tokensPromise = userProfile.assignedOfficeIds?.length
          ? supabase
              .from("tokens")
              .select(tokenQuery)
              .in("office_id", userProfile.assignedOfficeIds)
          : Promise.resolve({ data: [], error: null });

        usersPromise = Promise.resolve({ data: [], error: null });
      } else {
        // ADMIN
        tokensPromise = supabase.from("tokens").select(tokenQuery);
        usersPromise = supabase.from("profiles").select("*");
      }

      const [officesRes, notifRes, tokensRes, usersRes] = await Promise.all([
        supabase.from("offices").select("*"),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userProfile.id),
        tokensPromise,
        usersPromise
      ]);

      if (officesRes.error)
        throw new Error("Failed to load offices: " + officesRes.error.message);

      if (notifRes.error)
        throw new Error(
          "Failed to load notifications: " + notifRes.error.message
        );

      if (tokensRes.error)
        throw new Error("Failed to load tokens: " + tokensRes.error.message);

      if (usersRes.error)
        throw new Error("Failed to load users: " + usersRes.error.message);

      // -------------------------------------------------------
      // SET STATE
      // -------------------------------------------------------
      setOffices(officesRes.data.map(formatOfficeFromDB));

      setNotifications(
        notifRes.data.map((n: any) => ({
          id: n.id,
          message: n.message,
          userId: n.user_id
        }))
      );

      setTokens(tokensRes.data.map(formatToken));

      setUsers(
        usersRes.data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          universityId: u.university_id,
          role: u.role,
          assignedOfficeIds: u.assigned_office_ids
        }))
      );

      setLoading(false);
    } catch (err: any) {
      console.error("Startup error:", err);
      setError(err.message);

      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  // Load initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    loadSession(session);
  });

  // Listen for auth state changes
  const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
    loadSession(s);
  });

  return () => {
    mounted = false;
    if (timeoutId) clearTimeout(timeoutId);
    listener.subscription.unsubscribe();
  };
}, []);

// -------------------------------------------------------
// REALTIME SUBSCRIPTIONS
// -------------------------------------------------------
useEffect(() => {
  if (!session) return;

  // ------------------------------
  // TOKENS
  // ------------------------------
  const tokenSub = supabase
    .channel("tokens")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tokens" },
      (payload) => {
        const user = currentUserRef.current;
        if (!user) return;
const row = payload.new as any; // safely cast

const relevant =
  user.role === Role.ADMIN ||
  (user.role === Role.STUDENT && row?.student_id === user.id) ||
  (user.role === Role.STAFF && user.assignedOfficeIds?.includes(row?.office_id));

        if (!relevant) return;

        if (payload.eventType === "INSERT") {
          setTokens((prev) => [...prev, formatToken(payload.new)]);
        } else if (payload.eventType === "UPDATE") {
          setTokens((prev) =>
            prev.map((t) =>
              t.id === payload.new.id ? formatToken(payload.new) : t
            )
          );
        } else if (payload.eventType === "DELETE") {
          setTokens((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  // ------------------------------
  // OFFICES
  // ------------------------------
  const officeSub = supabase
    .channel("offices")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "offices" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setOffices((prev) => [...prev, formatOfficeFromDB(payload.new)]);
        } else if (payload.eventType === "UPDATE") {
          setOffices((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? formatOfficeFromDB(payload.new) : o
            )
          );
        } else if (payload.eventType === "DELETE") {
          setOffices((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  // ------------------------------
  // NOTIFICATIONS
  // ------------------------------
  const notifSub = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        setNotifications((prev) => [
          ...prev,
          {
            id: payload.new.id,
            message: payload.new.message,
            userId: payload.new.user_id
          }
        ]);

        // refresh tokens for current user
        if (payload.new.user_id === currentUserRef.current?.id) {
          refreshTokens();
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(tokenSub);
    supabase.removeChannel(officeSub);
    supabase.removeChannel(notifSub);
  };
}, [session, currentUser]);

// PART 2/4 END ---------------------------------------------------------------
// PART 3/4 ---------------------------------------------------------------
// -------------------------------------------------------
// AUTH FUNCTIONS
// -------------------------------------------------------

const login = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        message: "Email not confirmed. Please check your inbox.",
        code: "email_not_confirmed"
      };
    }
    return { success: false, message: error.message };
  }

  return { success: true, message: "Logged in successfully" };
};

const checkEmailAvailability = async (email: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", email);

  if (error)
    return {
      available: false,
      message: "Error checking email: " + error.message
    };

  if (data?.length > 0)
    return {
      available: false,
      message: "Email is already taken."
    };

  return { available: true, message: "Email is available." };
};

const signup = async (name: string, email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: Role.STUDENT
      }
    }
  });

  if (error) return { success: false, message: error.message };

  if (!data.session && data.user) {
    return {
      success: true,
      message: "Signup successful! Please verify your email."
    };
  }

  return { success: true, message: "Signed up & logged in" };
};

const verifySignupOtp = async (email: string, otp: string) => {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "signup"
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Email verified successfully!" };
};

const resendSignupOtp = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email
  });
  if (error) return { success: false, message: error.message };
  return { success: true, message: "Verification OTP resent." };
};

const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Logout failed: " + error.message);
};

const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  if (error) throw new Error("Reset password failed: " + error.message);
};

const resendVerificationOtp = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: "email_change",
    email
  });
  if (error) return { success: false, message: error.message };
  return { success: true, message: "OTP resent." };
};

const verifyEmailOtp = async (email: string, otp: string) => {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "email"
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "OTP Verified!" };
};

// -------------------------------------------------------
// BOOK TOKEN
// -------------------------------------------------------
const bookToken = async (
  officeId: string,
  purpose: string,
  priority: Priority
) => {
  if (!currentUser) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("tokens")
    .insert({
      student_id: currentUser.id,
      office_id: officeId,
      purpose,
      priority,
      status: TokenStatus.WAITING,
      is_checked_in: false,
      created_at: new Date().toISOString()
    })
    .select();

  if (error) throw new Error("Failed to book token: " + error.message);
  if (!data?.length) throw new Error("Token booking failed");

  setTokens((prev) => [...prev, formatToken(data[0])]);
};

// -------------------------------------------------------
// CALL NEXT TOKEN  ✅ DO NOT AUTO-SET NEXT TO IN_PROGRESS
// -------------------------------------------------------
const callNextToken = async (officeId: string) => {
  const before = [...tokens];
  const now = new Date();

  try {
    // Current student being served (if any)
    const current = tokens.find(
      (t) => t.officeId === officeId && t.status === TokenStatus.IN_PROGRESS
    );

    // Next student in queue (WAITING)
    const next = tokens.find(
      (t) => t.officeId === officeId && t.status === TokenStatus.WAITING
    );

    if (!next) throw new Error("No waiting students");

    // ✅ Optimistic UI: only COMPLETE current, don't touch next
    setTokens((prev) =>
      prev.map((t) => {
        if (current && t.id === current.id) {
          return {
            ...t,
            status: TokenStatus.COMPLETED,
            completedAt: now,
          };
        }
        return t;
      })
    );

    // ✅ DB: only mark current as COMPLETED
    const completePromise = current
      ? supabase
          .from("tokens")
          .update({
            status: TokenStatus.COMPLETED,
            completed_at: now.toISOString(),
          })
          .eq("id", current.id)
      : Promise.resolve({ error: null });

    const [res1] = await Promise.all([completePromise]);

    if (res1.error) {
      console.warn("Auto-complete failed:", res1.error.message);
    }

    // 🔄 Refresh tokens to fix any realtime delays
    await refreshTokens();

    // 🔔 Notify NEXT student: they can now scan the QR
    await supabase.from("notifications").insert({
      user_id: next.studentId,
      message:
        "You're next! Please scan the office QR to start your turn.",
    });
  } catch (err) {
    console.error("callNextToken error:", err);
    setTokens(before); // rollback UI if something failed
    throw err;
  }
};

// -------------------------------------------------------
// COMPLETE TOKEN (unchanged logic, just for manual complete)
// -------------------------------------------------------
const completeToken = async (tokenId: string) => {
  try {
    const now = new Date();

    // Immediate local UI update
    setTokens((prev) =>
      prev.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              status: TokenStatus.COMPLETED,
              completedAt: now,
            }
          : t
      )
    );

    // Persist DB update
    const { error } = await supabase
      .from("tokens")
      .update({
        status: TokenStatus.COMPLETED,
        completed_at: now.toISOString(),
      })
      .eq("id", tokenId);

    if (error) throw new Error("Complete token failed: " + error.message);

    // Force full refresh to sync queue
    await refreshTokens();
  } catch (err) {
    console.error("completeToken exception:", err);
    throw err;
  }
};

// -------------------------------------------------------
// STUDENT CHECK-IN (flag only, kept as-is)
// -------------------------------------------------------
const checkInStudent = async (tokenId: string) => {
  const { error } = await supabase
    .from("tokens")
    .update({ is_checked_in: true })
    .eq("id", tokenId);

  if (error) throw new Error("Check-in failed: " + error.message);
};

// -------------------------------------------------------
// SCAN OFFICE QR  ✅ ONLY HERE WE SET IN_PROGRESS + ETA
// -------------------------------------------------------
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

  // ONLY UPDATE THIS SPECIFIC TOKEN
  const now = new Date();
  await supabase
    .from("tokens")
    .update({
      status: TokenStatus.IN_PROGRESS,
      called_at: now.toISOString(),
      is_checked_in: true
    })
    .eq("id", nextWaiting.id);   // IMPORTANT FIX

  // Calculate ETA + notify next
  const completedTokens = officeTokens
    .filter((t) => t.status === TokenStatus.COMPLETED && t.calledAt && t.completedAt)
    .slice(-10);

  let avgMinutes = 3;
  if (completedTokens.length > 0) {
    const totalTime = completedTokens.reduce((sum, t) => {
      return sum + (new Date(t.completedAt!).getTime() - new Date(t.calledAt).getTime());
    }, 0);
    avgMinutes = Math.max(1, Math.round(totalTime / completedTokens.length / 60000));
  }

  const nextAfter = waitingList[1];
  if (nextAfter) {
    await supabase.from("notifications").insert({
      user_id: nextAfter.studentId,
      message: `Get ready! You are next. Estimated time: ${avgMinutes} minutes.`
    });
  }

  await refreshTokens();
};



// -------------------------------------------------------
// OFFICE CRUD
// -------------------------------------------------------
const addOffice = async (office: Omit<Office, "id">) => {
  const { error } = await supabase.from("offices").insert({
    name: office.name,
    operating_hours: office.operatingHours,
    token_limit: office.tokenLimit,
    is_active: office.isActive,
    prefix: office.prefix
  });

  if (error) throw new Error("Failed to add office: " + error.message);
};

const updateOffice = async (office: Office) => {
  const { error } = await supabase
    .from("offices")
    .update({
      name: office.name,
      operating_hours: office.operatingHours,
      token_limit: office.tokenLimit,
      is_active: office.isActive,
      prefix: office.prefix
    })
    .eq("id", office.id);

  if (error) throw new Error("Failed to update office: " + error.message);
};

const deleteOffice = async (officeId: string) => {
  const { error } = await supabase
    .from("offices")
    .delete()
    .eq("id", officeId);

  if (error) throw new Error("Failed to delete office: " + error.message);
};

// -------------------------------------------------------
// USER CRUD (Admin Only)
// -------------------------------------------------------
const addUser = async (user: any) => {
  const payload = {
    action: "create",
    full_name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    university_id: user.universityId ?? null,
    assigned_office_ids: user.assignedOfficeIds ?? []
  };

  const { data, error } = await supabase.functions.invoke(
    "user-management",
    { body: payload }
  );

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
};

const updateUser = async (user: User) => {
  const payload = {
    action: "update",
    user_id: user.id,
    full_name: user.name,
    role: user.role,
    university_id: user.universityId,
    assigned_office_ids: user.assignedOfficeIds
  };

  const { data, error } = await supabase.functions.invoke(
    "user-management",
    { body: payload }
  );

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
};

const deleteUser = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke(
    "user-management",
    {
      body: {
        action: "delete",
        user_id: userId
      }
    }
  );

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
};

// -------------------------------------------------------
// CLEAR NOTIFICATION
// -------------------------------------------------------
const clearNotification = async (notificationId: number) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) console.warn("Notification delete failed:", error);

    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  } catch (err) {
    console.error("Failed to clear notification:", err);
  }
};

// -------------------------------------------------------
// CONTEXT VALUE
// -------------------------------------------------------
const value = useMemo(
  () => ({
    supabase,
    session,
    currentUser,

    users,
    offices,
    tokens,
    notifications,

    loading,
    error,

    // Auth
    login,
    signup,
    logout,
    verifySignupOtp,
    resendSignupOtp,
    checkEmailAvailability,
    requestPasswordReset,
    resendVerificationOtp,
    verifyEmailOtp,

    // Tokens
    bookToken,
    callNextToken,
    completeToken,

    // Offices
    addOffice,
    updateOffice,
    deleteOffice,

    // Users
    addUser,
    updateUser,
    deleteUser,

    // Scan & Check-in
    checkInStudent,
    scanOfficeQr,

    // Notifications
    clearNotification,

    // Empty Queue Logic (Option A)
    isQueueEmpty
  }),
  [
    session,
    currentUser,
    users,
    offices,
    tokens,
    notifications,
    loading,
    error,
    isQueueEmpty
  ]
);
/* -------------------------------------------------------
   ENABLE GLOBAL PULL-TO-REFRESH
------------------------------------------------------- */
useGlobalPullToRefresh(async () => {
  console.log("🔄 Pull-to-refresh triggered");
  await refreshTokens();
});

// -------------------------------------------------------
// PROVIDER EXPORT
// -------------------------------------------------------
return (
  <AppContext.Provider value={value}>{children}</AppContext.Provider>
);
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};

// PART 4/4 END ---------------------------------------------------------------
