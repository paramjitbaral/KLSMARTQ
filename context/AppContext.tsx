import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useRef, useCallback } from 'react';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { User, Office, Token, Role, Priority, TokenStatus } from '../types';

// --- Supabase Client Setup ---
// FIX: Removed the complex and error-prone customFetch proxy.
// Initializing the client directly is more stable in this environment and resolves the persistent auth/fetch issues.
const SUPABASE_URL = 'https://awgnkxruzfljbhvvomlg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3Z25reHJ1emZsamJodnZvbWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDA2NzgsImV4cCI6MjA3NzkxNjY3OH0.tYhu129xg5NvyZwq0g7391ub6hpA3ri2cVYxYukR3gQ';
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


interface AppNotification {
  userId: string;
  message: string;
  id: number;
}

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
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; code?: string }>;
  checkEmailAvailability: (email: string) => Promise<{ available: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  verifySignupOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resendSignupOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendVerificationOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  bookToken: (officeId: string, purpose: string, priority: Priority) => Promise<void>;
  callNextToken: (officeId: string) => Promise<void>;
  completeToken: (tokenId: string) => Promise<void>;
  scanOfficeQr: (studentId: string, officeId: string) => Promise<void>;
  addOffice: (office: Omit<Office, 'id'>) => Promise<void>;
  updateOffice: (office: Office) => Promise<void>;
  deleteOffice: (officeId: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  checkInStudent: (tokenId: string) => Promise<void>;
  clearNotification: (notificationId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to consistently format token objects from Supabase
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
    student: t.profiles ? { name: t.profiles.full_name, universityId: t.profiles.university_id } : undefined,
});

// Helper to convert office from DB snake_case to app camelCase
const formatOfficeFromDB = (o: any): Office => ({
    id: o.id,
    name: o.name,
    operatingHours: o.operating_hours,
    tokenLimit: o.token_limit,
    isActive: o.is_active,
    prefix: o.prefix,
});

// Helper to convert office from app camelCase to DB snake_case
const formatOfficeForDB = (o: Partial<Omit<Office, 'id'>> | Partial<Office>) => ({
    name: o.name,
    operating_hours: o.operatingHours,
    token_limit: o.tokenLimit,
    is_active: o.isActive,
    prefix: o.prefix,
});


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
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

  // Manual refresh helper to keep tokens in sync if realtime lags
  const refreshTokens = useCallback(async () => {
    if (!session) return;
    const user = currentUserRef.current;
    if (!user) return;

    const tokenQuery = '*, profiles(full_name, university_id)';
    let query = supabase.from('tokens').select(tokenQuery);

    if (user.role === Role.STUDENT) {
        query = query.eq('student_id', user.id);
    } else if (user.role === Role.STAFF) {
        if (!user.assignedOfficeIds || user.assignedOfficeIds.length === 0) {
            setTokens([]);
            return;
        }
        query = query.in('office_id', user.assignedOfficeIds);
    }

    const { data, error } = await query;
    if (error) {
        console.warn('Token refresh failed:', error.message);
        return;
    }
    setTokens(data.map(formatToken));
  }, [session]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const loadSession = async (session: Session | null) => {
        if (!mounted) return;
        
        setSession(session);
        if (session) {
            setError(null);
            try {
                // Set a 15-second timeout to prevent indefinite loading on network failures
                const timeoutPromise = new Promise((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error("Database connection timeout. Please check your internet connection and try again."));
                    }, 15000);
                });

                // 1. Fetch user profile - this is the critical step after login
                const { data: profile, error: profileError } = await Promise.race([
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single(),
                    timeoutPromise
                ]) as any;

                if (profileError) {
                     const detailMessage = typeof profileError.message === 'string' 
                        ? profileError.message 
                        : JSON.stringify(profileError);
                    throw new Error(`Failed to fetch profile: ${detailMessage}`);
                }
                
                if (!profile) {
                    throw new Error("User profile not found in database.");
                }

                const userProfile: User = {
                    id: profile.id, name: profile.full_name, email: profile.email,
                    universityId: profile.university_id, role: profile.role,
                    assignedOfficeIds: profile.assigned_office_ids,
                };
                
                // Clear timeout since we got data
                if (timeoutId) clearTimeout(timeoutId);
                
                // 2. Fetch all other necessary data in parallel
                const officesPromise = supabase.from('offices').select('*');
                const notificationsPromise = supabase.from('notifications').select('*').eq('user_id', session.user.id);
                
                let tokensPromise;
                let usersPromise;
                const tokenQuery = '*, profiles(full_name, university_id)';

                switch(userProfile.role) {
                    case Role.STUDENT:
                        tokensPromise = supabase.from('tokens').select(tokenQuery).eq('student_id', userProfile.id);
                        usersPromise = Promise.resolve({ data: [], error: null }); // Student doesn't need all users
                        break;
                    case Role.STAFF:
                        tokensPromise = userProfile.assignedOfficeIds?.length 
                            ? supabase.from('tokens').select(tokenQuery).in('office_id', userProfile.assignedOfficeIds)
                            : Promise.resolve({ data: [], error: null });
                         usersPromise = Promise.resolve({ data: [], error: null }); // Staff doesn't need all users
                        break;
                    case Role.ADMIN:
                    default:
                        tokensPromise = supabase.from('tokens').select(tokenQuery);
                        usersPromise = supabase.from('profiles').select('*');
                        break;
                }

                const [officesRes, notificationsResponse, tokensRes, usersRes] = await Promise.all([officesPromise, notificationsPromise, tokensPromise, usersPromise]);

                if (officesRes.error) throw new Error(`Failed to fetch offices: ${officesRes.error.message}`);
                if (notificationsResponse.error) throw new Error(`Failed to fetch notifications: ${notificationsResponse.error.message}`);
                if (tokensRes.error) throw new Error(`Failed to fetch tokens: ${tokensRes.error.message}`);
                if (usersRes.error) throw new Error(`Failed to fetch users: ${usersRes.error.message}`);
                
                if (!mounted) return;
                
                // 3. Set all state at once after successful fetching
                setCurrentUser(userProfile);
                currentUserRef.current = userProfile;
                setOffices(officesRes.data.map(formatOfficeFromDB));
                setNotifications(notificationsResponse.data.map((n: any) => ({ id: n.id, message: n.message, userId: n.user_id })));
                setTokens(tokensRes.data.map(formatToken));
                setUsers(usersRes.data.map((u: any) => ({
                    id: u.id, name: u.full_name, email: u.email, universityId: u.university_id,
                    role: u.role, assignedOfficeIds: u.assigned_office_ids
                })));
                
            } catch (err: any) {
                console.error("Critical error during initial data load:", err);
                if (!mounted) return;
                setError(err.message || "An unknown error occurred during application startup.");
                // Log out the user if the initial data load fails to prevent a broken state
                await supabase.auth.signOut();
                setCurrentUser(null);
                setSession(null);
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
                if (mounted) {
                    setLoading(false);
                }
            }
        } else {
            // No session, clear all user data and stop loading
            if (!mounted) return;
            setCurrentUser(null);
            setUsers([]);
            setOffices([]);
            setTokens([]);
            setNotifications([]);
            setError(null);
            setLoading(false);
        }
    };
    
    // Initialize: Check for existing session immediately
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
        loadSession(session);
    }).catch((err) => {
        console.error("Failed to get session:", err);
        if (mounted) {
            setError("Failed to initialize authentication. Please check your connection and refresh the page.");
            setLoading(false);
        }
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        loadSession(session);
    });

    return () => {
        mounted = false;
        if (timeoutId) clearTimeout(timeoutId);
        subscription.unsubscribe();
    };
  }, []);
  
    useEffect(() => {
        if (!session) return;

        console.log("Setting up real-time subscriptions for user:", currentUserRef.current?.role);

        const handleTokenChange = (payload: any) => {
             const user = currentUserRef.current;
             if(!user) return;
             
             const isRelevant = 
                user.role === Role.ADMIN ||
                (user.role === Role.STUDENT && payload.new.student_id === user.id) ||
                (user.role === Role.STAFF && user.assignedOfficeIds?.includes(payload.new.office_id));

            console.log(`Token ${payload.eventType}:`, {
                tokenData: payload.new,
                isRelevant,
                userRole: user.role,
                userAssignedOffices: user.assignedOfficeIds,
                tokenOffice: payload.new.office_id
            });

            if (isRelevant) {
                 if (payload.eventType === 'INSERT') {
                    console.log("Adding new token to state");
                    setTokens(prev => [...prev, formatToken(payload.new)]);
                } else if (payload.eventType === 'UPDATE') {
                    console.log("Updating token in state");
                    setTokens(prev => prev.map(t => t.id === payload.new.id ? formatToken(payload.new) : t));
                } else if (payload.eventType === 'DELETE') {
                    console.log("Removing token from state");
                    setTokens(prev => prev.filter(t => t.id !== payload.old.id));
                }
            }
        };
        
        const handleOfficeChange = (payload: any) => {
            console.log("Office changed:", payload.eventType);
            if (payload.eventType === 'INSERT') {
                setOffices(prev => [...prev, formatOfficeFromDB(payload.new)]);
            } else if (payload.eventType === 'UPDATE') {
                setOffices(prev => prev.map(o => o.id === payload.new.id ? formatOfficeFromDB(payload.new) : o));
            } else if (payload.eventType === 'DELETE') {
                setOffices(prev => prev.filter(o => o.id !== payload.old.id));
            }
        };

        const handleUserChange = (payload: any) => {
            if (currentUserRef.current?.role === Role.ADMIN) {
                const updatedUser = { id: payload.new.id, name: payload.new.full_name, email: payload.new.email, universityId: payload.new.university_id, role: payload.new.role, assignedOfficeIds: payload.new.assigned_office_ids };
                if (payload.eventType === 'INSERT') {
                    setUsers(prev => [...prev, updatedUser]);
                } else if (payload.eventType === 'UPDATE') {
                    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                } else if (payload.eventType === 'DELETE') {
                    setUsers(prev => prev.filter(u => u.id !== payload.old.id));
                }
            }
        };

        const handleNotificationChange = (payload: any) => {
          console.log("📢 Notification received:", payload);
          if (payload.eventType === 'INSERT') {
            const newNotif = { id: payload.new.id, message: payload.new.message, userId: payload.new.user_id };
            setNotifications(prev => [...prev, newNotif]);

            // If the notification is for the active user, refresh tokens to avoid waiting on realtime lag
            if (payload.new.user_id === currentUserRef.current?.id) {
              refreshTokens();
            }
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        };

        const tokensSubscription = supabase.channel('public:tokens').on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, handleTokenChange).subscribe();
        const officesSubscription = supabase.channel('public:offices').on('postgres_changes', { event: '*', schema: 'public', table: 'offices' }, handleOfficeChange).subscribe();
        const usersSubscription = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleUserChange).subscribe();
        const notificationsSubscription = supabase.channel('public:notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleNotificationChange).subscribe();

        return () => {
            supabase.removeChannel(tokensSubscription);
            supabase.removeChannel(officesSubscription);
            supabase.removeChannel(usersSubscription);
            supabase.removeChannel(notificationsSubscription);
        };
    }, [session, currentUser]);


  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        if (error.message.includes("Email not confirmed")) {
            return { success: false, message: "Email not confirmed. Please check your inbox for a verification link.", code: 'email_not_confirmed' };
        }
        return { success: false, message: error.message };
    }
    return { success: true, message: 'Logged in successfully' };
  };

  const checkEmailAvailability = async (email: string) => {
    const { data, error } = await supabase.from('profiles').select('email').eq('email', email);
    if (error) return { available: false, message: `Error checking email: ${error.message}` };
    if (data && data.length > 0) return { available: false, message: 'Email is already taken.' };
    return { available: true, message: 'Email is available.' };
  };
  
  const signup = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                role: Role.STUDENT, // Default role for public signup
            },
        },
    });
    if (error) return { success: false, message: error.message };
    if (!data.session && data.user) return { success: true, message: 'Signup successful! Please check your email to verify your account.'};
    return { success: true, message: 'Signed up and logged in successfully' };
  };
  
  const verifySignupOtp = async (email: string, otp: string) => {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Email verified successfully!' };
  };
  
  const resendSignupOtp = async (email: string) => {
      const { data, error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Verification code resent.' };
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Logout failed:", error);
        throw new Error(`Logout failed: ${error.message}`);
    }
    // Auth state change will clear local state
  };

  const requestPasswordReset = async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
          console.error("Password reset request failed:", error);
          throw new Error(`Password reset request failed: ${error.message}`);
      }
  };
  
  const verifyEmailOtp = async (email: string, otp: string) => {
     // This is a generic OTP verification. Used for email change, phone change etc.
     // For signup, use verifySignupOtp
     const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
     if (error) return { success: false, message: error.message };
     return { success: true, message: 'OTP verified!' };
  }
  
  const resendVerificationOtp = async (email: string) => {
      // Generic resend, assumes type 'email_change'. For signup, use resendSignupOtp.
      const { data, error } = await supabase.auth.resend({ type: 'email_change', email });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Verification code resent.' };
  }

  const bookToken = async (officeId: string, purpose: string, priority: Priority) => {
    if (!currentUser) throw new Error("User not logged in");
    
    try {
      console.log("Attempting to book token with:", {
        student_id: currentUser.id,
        office_id: officeId,
        purpose: purpose,
        priority: priority
      });

      // Insert token directly into the tokens table
      const { data, error } = await supabase.from('tokens').insert({
        student_id: currentUser.id,
        office_id: officeId,
        purpose: purpose,
        priority: priority,
        status: TokenStatus.WAITING,
        is_checked_in: false,
        created_at: new Date().toISOString(),
      }).select();

      if (error) {
        console.error("❌ Token booking error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to book token: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error("❌ Token booking failed - no data returned");
        throw new Error("Token booking failed - no data returned");
      }

      console.log("✅ Token booked successfully:", data[0]);
      
      // Update local state with the new token
      const newToken = formatToken(data[0]);
      setTokens(prev => [...prev, newToken]);
      
    } catch (err: any) {
      console.error("❌ Error in bookToken:", err);
      throw err;
    }
  };

  const callNextToken = async (officeId: string) => {
    const previousTokensSnapshot = tokens;
    const now = new Date();

    try {
      // Step 1: Locate current IN_PROGRESS token for optimistic completion
      const currentToken = tokens.find(t => t.officeId === officeId && t.status === TokenStatus.IN_PROGRESS);

      // Step 2: Find first waiting token for this office
      const waitingToken = tokens.find(t => t.officeId === officeId && t.status === TokenStatus.WAITING);
      if (!waitingToken) {
        throw new Error("No students waiting in this office");
      }

      // Step 3: Optimistically update local state for snappier UI
      setTokens(prev => prev.map(t => {
        if (currentToken && t.id === currentToken.id) {
          return { ...t, status: TokenStatus.COMPLETED, completedAt: now };
        }
        if (t.id === waitingToken.id) {
          return { ...t, status: TokenStatus.IN_PROGRESS, calledAt: now };
        }
        return t;
      }));

      console.log("Calling next token:", waitingToken.id);

      // Step 4: Persist DB updates in parallel to reduce latency
      const [completeResult, updateResult] = await Promise.all([
        currentToken
          ? supabase
              .from('tokens')
              .update({ status: TokenStatus.COMPLETED, completed_at: now.toISOString() })
              .eq('id', currentToken.id)
          : Promise.resolve({ error: null }),
        supabase
          .from('tokens')
          .update({ status: TokenStatus.IN_PROGRESS, called_at: now.toISOString() })
          .eq('id', waitingToken.id)
      ]);

      if (completeResult.error) {
        console.warn("Could not auto-complete previous token:", completeResult.error);
      } else if (currentToken) {
        console.log("✅ Previous token completed");
      }

      if (updateResult.error) {
        throw new Error(updateResult.error.message);
      }

      // Force refresh tokens from DB to ensure UI is up-to-date
      const tokenQuery = '*, profiles(full_name, university_id)';
      let query = supabase.from('tokens').select(tokenQuery);
      if (currentUser?.role === Role.STAFF) {
        if (currentUser.assignedOfficeIds && currentUser.assignedOfficeIds.length > 0) {
          query = query.in('office_id', currentUser.assignedOfficeIds);
        }
      } else if (currentUser?.role === Role.STUDENT) {
        query = query.eq('student_id', currentUser.id);
      }
      const { data: refreshedTokens, error: refreshError } = await query;
      if (!refreshError && refreshedTokens) {
        setTokens(refreshedTokens.map(formatToken));
      }

      console.log("✅ Next token called successfully");

      // Step 5 & 6: Send notifications in background (non-blocking)
      const waitingTokensForOffice = tokens
        .filter(t => t.officeId === officeId && t.status === TokenStatus.WAITING)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const nextStudent = waitingTokensForOffice[0];
      
      // Fire notifications without awaiting to avoid blocking UI
      Promise.all([
        supabase.from('notifications').insert({
          user_id: waitingToken.studentId,
          message: `Your turn! Please proceed to ${offices.find(o => o.id === officeId)?.name || 'the office'}`
        }),
        nextStudent && nextStudent.id !== waitingToken.id
          ? supabase.from('notifications').insert({
              user_id: nextStudent.studentId,
              message: `You are next! Estimated wait time: ${waitingTokensForOffice.indexOf(nextStudent) * 5} minutes`
            })
          : Promise.resolve()
      ]).catch(err => console.warn("Notification send error (non-critical):", err));

    } catch (err: any) {
      // Revert optimistic update on failure
      setTokens(previousTokensSnapshot);
      console.error("❌ Error calling next token:", err);
      throw err;
    }
  };
  
  const completeToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('tokens')
        .update({ 
          status: TokenStatus.COMPLETED, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', tokenId);
      
      if (error) throw new Error(error.message);
      
      console.log("✅ Token marked as completed");
    } catch (err: any) {
      console.error("❌ Error completing token:", err);
      throw err;
    }
  };
  
  const checkInStudent = async (tokenId: string) => {
      try {
        const { error } = await supabase.from('tokens').update({ is_checked_in: true }).eq('id', tokenId);
        if (error) throw new Error(error.message);
        console.log("✅ Student checked in");
      } catch (err: any) {
        console.error("❌ Error checking in student:", err);
        throw err;
      }
  };

  const scanOfficeQr = async (studentId: string, officeId: string) => {
    try {
      // Step 1: Find first WAITING token for this student in this office
      const studentToken = tokens.find(t => 
        t.studentId === studentId && 
        t.officeId === officeId && 
        t.status === TokenStatus.WAITING
      );
      
      if (!studentToken) {
        throw new Error("You don't have any waiting tokens for this office");
      }

      // Step 2: Check if someone else is already being served
      const currentToken = tokens.find(t => t.officeId === officeId && t.status === TokenStatus.IN_PROGRESS);
      if (currentToken && currentToken.id !== studentToken.id) {
        throw new Error("Please wait for your turn! Someone is currently being served.");
      }

      // Step 3: Check if this student is actually next in the queue
      const waitingTokensForOffice = tokens
        .filter(t => t.officeId === officeId && t.status === TokenStatus.WAITING)
        .sort((a, b) => {
          if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT) return -1;
          if (b.priority === Priority.URGENT && a.priority !== Priority.URGENT) return 1;
          if (a.priority === Priority.MEDICAL && b.priority !== Priority.MEDICAL) return -1;
          if (b.priority === Priority.MEDICAL && a.priority !== Priority.MEDICAL) return 1;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      const nextInLine = waitingTokensForOffice[0];
      if (!nextInLine || nextInLine.id !== studentToken.id) {
        const position = waitingTokensForOffice.findIndex(t => t.id === studentToken.id) + 1;
        throw new Error(`Please wait for your turn! You are number ${position} in the queue.`);
      }

      console.log("🔍 Student scanned QR, moving token to IN_PROGRESS:", studentToken.id);

      // Step 4: Update scanned token status to IN_PROGRESS
      const { error: updateError } = await supabase
        .from('tokens')
        .update({ 
          status: TokenStatus.IN_PROGRESS,
          called_at: new Date().toISOString()
        })
        .eq('id', studentToken.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      console.log("✅ Token moved to IN_PROGRESS via QR scan");

      // Step 5: Create notification for the student confirming check-in
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: studentId,
        message: `✓ You're now being served! Please proceed to ${offices.find(o => o.id === officeId)?.name || 'the counter'}`
      });

      if (notifError) {
        console.warn("Could not create notification:", notifError);
      }

      // Step 6: Create notification for next student in queue
      const remainingWaitingTokens = tokens
        .filter(t => t.officeId === officeId && t.status === TokenStatus.WAITING)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      if (remainingWaitingTokens.length > 0) {
        const nextStudent = remainingWaitingTokens[0];
        const position = remainingWaitingTokens.length; // How many students ahead
        const avgTime = 5; // 5 minutes per student
        const estimatedTime = position * avgTime;
        
        await supabase.from('notifications').insert({
          user_id: nextStudent.studentId,
          message: `Get ready! You're next in line. Estimated wait time: ${estimatedTime} minutes`
        });
      }

      console.log("✅ QR scan processed successfully");

    } catch (err: any) {
      console.error("❌ Error scanning office QR:", err);
      throw err;
    }
  };

  const addOffice = async (office: Omit<Office, 'id'>) => {
    const { error } = await supabase.from('offices').insert(formatOfficeForDB(office));
    if (error) throw new Error(error.message);
  };

  const updateOffice = async (office: Office) => {
    const { error } = await supabase.from('offices').update(formatOfficeForDB(office)).eq('id', office.id);
    if (error) throw new Error(error.message);
  };

  const deleteOffice = async (officeId: string) => {
    const { error } = await supabase.from('offices').delete().eq('id', officeId);
    if (error) throw new Error(error.message);
  };
  
  const addUser = async (user: Omit<User, 'id'> & { password?: string }) => {
    // Build payload exclusively for staff creation (admin dashboard use-case)
    const payload: any = {
      action: 'add',
      email: user.email.trim(),
      password: user.password!,
      full_name: user.name.trim(),
      role: Role.STAFF, // Force Staff; admin shouldn't create other roles here.
      assigned_office_ids: user.assignedOfficeIds || []
    };

    console.log('addUser invoking edge function with payload:', payload);

    try {
      const { data, error } = await supabase.functions.invoke('user-management', { body: payload });

      if (error) {
        // Fetch raw response for better diagnostics (status codes like 409)
        try {
          const sessionRes = await supabase.auth.getSession();
          const accessToken = sessionRes.data.session?.access_token;
          const rawRes = await fetch(`${SUPABASE_URL}/functions/v1/user-management`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': accessToken ? `Bearer ${accessToken}` : '',
              'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(payload),
          });
          let rawJson: any = null;
          try { rawJson = await rawRes.json(); } catch {}
          console.error('Edge function raw status:', rawRes.status, 'body:', rawJson);
          const rawMsg: string | undefined = rawJson?.error || error.message;
          if (rawRes.status === 409 || (rawMsg && /already exists|duplicate key/i.test(rawMsg))) {
            throw new Error('A staff user with this email already exists.');
          }
          throw new Error(rawMsg || 'Failed to create staff user');
        } catch(fetchErr: any) {
          console.error('Diagnostics fetch failed:', fetchErr);
          throw new Error(fetchErr.message || error.message || 'Failed to create staff user');
        }
      }

      if (data?.error) {
        if (/already exists|duplicate key/i.test(data.error)) {
          throw new Error('A staff user with this email already exists.');
        }
        throw new Error(data.error);
      }
      console.log('Staff user created successfully:', data);
    } catch (err) {
      console.error('addUser (staff) failed:', err);
      throw err;
    }
  };
  
  const updateUser = async (user: User) => {
    const payload = {
      action: 'update',
      user_id: user.id,
      full_name: user.name,
      role: user.role,
      university_id: user.universityId || null,
      assigned_office_ids: user.assignedOfficeIds || []
    };

    console.log('updateUser payload:', payload);
    const { data, error } = await supabase.functions.invoke('user-management', { body: payload });
    if (error) {
      // attempt raw fetch to capture backend error body/status
      try {
        const sessionRes = await supabase.auth.getSession();
        const accessToken = sessionRes.data.session?.access_token;
        const rawRes = await fetch(`${SUPABASE_URL}/functions/v1/user-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(payload),
        });
        let rawJson: any = null;
        try { rawJson = await rawRes.json(); } catch {}
        console.error('Edge function raw status (update):', rawRes.status, 'body:', rawJson);
        const rawMsg: string | undefined = rawJson?.error || error.message;
        if (rawRes.status === 409 || (rawMsg && /already exists|duplicate key/i.test(rawMsg))) {
          throw new Error('A user with this email already exists.');
        }
        throw new Error(rawMsg || error.message || 'Failed to update user');
      } catch (fetchErr: any) {
        console.error('updateUser diagnostics fetch failed:', fetchErr);
        throw new Error(fetchErr.message || error.message || 'Failed to update user');
      }
    }
    if (data?.error) throw new Error(data.error);
  };
  
  const deleteUser = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke('user-management', {
      body: {
        action: 'delete',
        user_id: userId
      }
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
  };

  const clearNotification = async (notificationId: number) => {
    try {
      // Delete from database so it won't show again on re-login
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.warn("Could not delete notification from database:", error);
      }
      
      // Remove from local state immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error("Error clearing notification:", err);
      // Still remove from local state even if DB delete fails
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };


  const value = useMemo(() => ({
    supabase, session, currentUser, users, offices, tokens, notifications, loading, error,
    login, checkEmailAvailability, signup, verifySignupOtp, resendSignupOtp, logout, requestPasswordReset, resendVerificationOtp, verifyEmailOtp,
    bookToken, callNextToken, completeToken, checkInStudent, scanOfficeQr,
    addOffice, updateOffice, deleteOffice,
    addUser, updateUser, deleteUser,
    clearNotification,
  }), [session, currentUser, users, offices, tokens, notifications, loading, error]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
