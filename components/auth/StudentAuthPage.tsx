import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Role } from '../../types';
import { EyeIcon, EyeOffIcon, CheckCircleIcon } from '../common/Icons';

// --- Reusable UI Components ---

const InputField = React.forwardRef<HTMLInputElement, { id: string, type: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean, autoComplete?: string }>(
({ id, type, placeholder, value, onChange, disabled = false, autoComplete }, ref) => (
    <div>
        <label htmlFor={id} className="sr-only">{placeholder}</label>
        <input
            ref={ref}
            id={id}
            name={id}
            type={type}
            required
            autoComplete={autoComplete}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light bg-white text-neutral-900 transition-shadow duration-200 shadow-sm focus:shadow-md disabled:bg-neutral-100 disabled:cursor-not-allowed"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
        />
    </div>
));

const PasswordField: React.FC<{
    id: string,
    placeholder: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onFocus?: () => void,
    onBlur?: () => void,
    autoComplete?: string
}> = ({ id, placeholder, value, onChange, onFocus, onBlur, autoComplete }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative">
            <InputField
                id={id}
                type={isVisible ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-500 hover:text-primary-dark"
                aria-label={isVisible ? "Hide password" : "Show password"}
            >
                {isVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>
    );
};

const AuthButton: React.FC<{ onClick?: () => void; type: 'submit' | 'button'; isLoading: boolean; disabled?: boolean; children: React.ReactNode; }> =
({ onClick, type, isLoading, disabled = false, children }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={isLoading || disabled}
        className="w-full flex justify-center items-center bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light transition-all duration-300 transform hover:scale-105 disabled:bg-neutral-400 disabled:scale-100 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
    >
        {isLoading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : children}
    </button>
);

const OtpInput: React.FC<{ value: string; onChange: (value: string) => void; }> = ({ value, onChange }) => {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Set focus on the first empty input
        const firstEmptyIndex = value.length;
        if (firstEmptyIndex < 6) {
            inputsRef.current[firstEmptyIndex]?.focus();
        } else {
             inputsRef.current[5]?.focus();
        }
    }, []);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newValue = e.target.value;
        const newOtp = [...value];
        newOtp[index] = newValue.slice(-1); // Take the last character if more than one is entered
        onChange(newOtp.join('').slice(0, 6));

        // Move to next input if a digit is entered
        if (newValue && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            onChange(pastedData);
            const lastDigitIndex = Math.min(pastedData.length, 6) - 1;
            inputsRef.current[lastDigitIndex]?.focus();
        }
    };

    return (
        <div className="flex justify-center space-x-2" onPaste={handlePaste}>
            {Array.from({ length: 6 }).map((_, index) => (
                <input
                    key={index}
                    ref={el => inputsRef.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light bg-white text-neutral-900 transition-shadow duration-200 shadow-sm focus:shadow-md"
                    aria-label={`OTP Digit ${index + 1}`}
                />
            ))}
        </div>
    );
};


// --- Main Component States ---

type AuthState = 'login' | 'signup' | 'verify' | 'forgot_password';

const StudentAuthPage: React.FC = () => {
    const [authState, setAuthState] = useState<AuthState>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // For OTP verification state
    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpEmailRef = useRef(''); // Store the email that needs OTP verification

    const { login, signup, verifySignupOtp, resendSignupOtp, requestPasswordReset } = useAppContext();

    // Timer for OTP resend cooldown
    useEffect(() => {
        let timer: number;
        if (resendCooldown > 0) {
            timer = window.setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);

    // Clear errors when switching auth state
    const switchAuthState = (newState: AuthState) => {
        setError('');
        setInfo('');
        setAuthState(newState);
    };
    
    // --- Handlers ---

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setIsLoading(true);
        const { success, message, code } = await login(email, password);
        if (!success) {
            if (code === 'email_not_confirmed') {
                otpEmailRef.current = email;
                await resendSignupOtp(email); // Attempt to resend OTP immediately
                setInfo('Your email is not confirmed. We have sent a new verification code.');
                setResendCooldown(60);
                switchAuthState('verify');
            } else {
                setError(message);
            }
        }
        // On success, the AppContext's onAuthStateChange will handle navigation
        setIsLoading(false);
    };

    const handleSignup = async (name: string, pass: string) => {
        setError('');
        setInfo('');
        setIsLoading(true);
        const { success, message } = await signup(name, email, pass);
        if (success) {
            otpEmailRef.current = email;
            setInfo('Account created! Please check your email for a verification code.');
            setResendCooldown(60);
            switchAuthState('verify');
        } else {
            setError(message);
        }
        setIsLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }
        setError('');
        setInfo('');
        setIsLoading(true);
        const { success, message } = await verifySignupOtp(otpEmailRef.current, otp);
        if (success) {
            setInfo('Verification successful! You can now log in.');
            setOtp('');
            switchAuthState('login');
        } else {
            setError(message);
        }
        setIsLoading(false);
    };
    
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setInfo('');
        setIsLoading(true);
        const { success, message } = await resendSignupOtp(otpEmailRef.current);
        if(success) {
            setInfo('A new code has been sent.');
            setResendCooldown(60);
        } else {
            setError(message);
        }
        setIsLoading(false);
    }
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setIsLoading(true);
        try {
            await requestPasswordReset(email);
            setInfo('If an account with that email exists, a password reset link has been sent.');
            setTimeout(() => switchAuthState('login'), 4000);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link.');
        }
        setIsLoading(false);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-light to-primary-dark flex flex-col items-center justify-center p-4 font-sans selection:bg-secondary selection:text-primary-dark">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-white tracking-tight">Welcome to KL SmartQ</h1>
                <p className="text-lg text-blue-100 mt-2">The modern way to manage queues at KL University.</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300">
                {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm mb-4 text-center" role="alert">{error}</div>}
                {info && <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm mb-4 text-center" role="status">{info}</div>}

                {authState === 'login' && (
                    <LoginForm
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        onSubmit={handleLogin}
                        isLoading={isLoading}
                        onForgotPassword={() => switchAuthState('forgot_password')}
                        onSwitchToSignup={() => switchAuthState('signup')}
                    />
                )}
                
                {authState === 'signup' && (
                    <SignupForm
                        email={email}
                        setEmail={setEmail}
                        onSubmit={handleSignup}
                        isLoading={isLoading}
                        onSwitchToLogin={() => switchAuthState('login')}
                    />
                )}
                
                {authState === 'verify' && (
                     <VerifyOtpForm
                        email={otpEmailRef.current}
                        otp={otp}
                        setOtp={setOtp}
                        onSubmit={handleVerifyOtp}
                        onResend={handleResendOtp}
                        resendCooldown={resendCooldown}
                        isLoading={isLoading}
                        onBackToLogin={() => switchAuthState('login')}
                     />
                )}
                
                {authState === 'forgot_password' && (
                    <ForgotPasswordForm
                        email={email}
                        setEmail={setEmail}
                        onSubmit={handlePasswordReset}
                        isLoading={isLoading}
                        onBackToLogin={() => switchAuthState('login')}
                    />
                )}
            </div>
            
            <footer className="text-center mt-10 text-blue-200 text-sm">
                <p>&copy; {new Date().getFullYear()} KL University. All rights reserved.</p>
            </footer>
        </div>
    );
};

// --- Sub-Components for Different Auth States ---

const LoginForm: React.FC<{
    email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void; isLoading: boolean; onForgotPassword: () => void; onSwitchToSignup: () => void;
}> = ({ email, setEmail, password, setPassword, onSubmit, isLoading, onForgotPassword, onSwitchToSignup }) => {
    const emailInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { emailInputRef.current?.focus(); }, []);

    return (
        <div>
            <h2 className="text-3xl font-bold text-center text-neutral-800 mb-6">Login</h2>
            <form id="login-form" className="space-y-4" onSubmit={onSubmit}>
                <InputField ref={emailInputRef} id="loginEmail" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
                <div>
                    <PasswordField id="loginPassword" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                    <div className="text-right mt-2">
                        <button type="button" onClick={onForgotPassword} className="text-sm font-medium text-primary-dark hover:underline focus:outline-none">Forgot Password?</button>
                    </div>
                </div>
                <AuthButton type="submit" isLoading={isLoading}>Login</AuthButton>
            </form>
            <p className="text-center text-sm text-neutral-600 mt-6">
                Don't have an account?{' '}
                <button onClick={onSwitchToSignup} className="font-semibold text-primary-dark hover:underline">Sign Up</button>
            </p>
        </div>
    );
};


const SignupForm: React.FC<{
    email: string; setEmail: (v: string) => void;
    onSubmit: (name: string, pass: string) => void; isLoading: boolean; onSwitchToLogin: () => void;
}> = ({ email, setEmail, onSubmit, isLoading, onSwitchToLogin }) => {
    const { checkEmailAvailability } = useAppContext();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
    const [emailMessage, setEmailMessage] = useState('');
    const debounceTimeoutRef = useRef<number | null>(null);

    // Debounced email availability check
    useEffect(() => {
        if (!email) { setEmailStatus('idle'); setEmailMessage(''); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setEmailStatus('unavailable'); setEmailMessage('Please enter a valid email.'); return; }
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        setEmailStatus('checking');
        debounceTimeoutRef.current = window.setTimeout(async () => {
            const { available, message } = await checkEmailAvailability(email);
            setEmailStatus(available ? 'available' : 'unavailable');
            setEmailMessage(message);
        }, 500);
        return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
    }, [email, checkEmailAvailability]);

    const passwordCriteria = useMemo(() => ([
        { name: '8+ Characters', met: password.length >= 8 },
        { name: '1 Uppercase', met: /[A-Z]/.test(password) },
        { name: '1 Number', met: /[0-9]/.test(password) },
        { name: '1 Special', met: /[!@#$%^&*]/.test(password) },
    ]), [password]);

    const allCriteriaMet = useMemo(() => passwordCriteria.every(c => c.met), [passwordCriteria]);
    const passwordsMatch = useMemo(() => password && password === confirmPassword, [password, confirmPassword]);
    const isFormValid = useMemo(() => name.trim() && emailStatus === 'available' && allCriteriaMet && passwordsMatch, [name, emailStatus, allCriteriaMet, passwordsMatch]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(isFormValid) {
            onSubmit(name, password);
        }
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold text-center text-neutral-800 mb-6">Create Account</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <InputField id="signupName" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                <div>
                    <InputField id="signupEmail" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                    <div className="h-5 text-xs text-center mt-1">
                        {emailStatus === 'checking' && <p className="text-neutral-500">Checking availability...</p>}
                        {emailStatus === 'available' && <p className="text-green-600">{emailMessage}</p>}
                        {emailStatus === 'unavailable' && <p className="text-red-500">{emailMessage}</p>}
                    </div>
                </div>
                <PasswordField id="signupPassword" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"/>
                {password && <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs px-1">
                    {passwordCriteria.map(c => (
                         <li key={c.name} className={`flex items-center transition-colors ${c.met ? 'text-green-600' : 'text-neutral-500'}`}>
                            <CheckCircleIcon className={`w-4 h-4 mr-1.5 flex-shrink-0 ${c.met ? 'stroke-current' : 'stroke-neutral-400'}`} />
                            <span>{c.name}</span>
                        </li>
                    ))}
                </ul>}
                <PasswordField id="confirmPassword" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password"/>
                 {confirmPassword && !passwordsMatch && <p className="text-xs text-center text-red-500">Passwords do not match.</p>}
                
                <AuthButton type="submit" isLoading={isLoading} disabled={!isFormValid}>Create Account</AuthButton>
            </form>
            <p className="text-center text-sm text-neutral-600 mt-6">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-semibold text-primary-dark hover:underline">Login</button>
            </p>
        </div>
    );
};

const VerifyOtpForm: React.FC<{
    email: string; otp: string; setOtp: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void; onResend: () => void;
    resendCooldown: number; isLoading: boolean; onBackToLogin: () => void;
}> = ({ email, otp, setOtp, onSubmit, onResend, resendCooldown, isLoading, onBackToLogin }) => {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-800 mb-2">Verify Your Email</h2>
            <p className="text-neutral-600 mb-6">Enter the code sent to <strong className="font-semibold text-neutral-800">{email}</strong></p>
            <form className="space-y-4" onSubmit={onSubmit}>
                <OtpInput value={otp} onChange={setOtp} />
                <AuthButton type="submit" isLoading={isLoading}>Verify</AuthButton>
            </form>
            <div className="mt-6 text-sm space-y-2">
                <p className="text-neutral-600">Didn't receive a code?</p>
                <button
                    onClick={onResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="font-semibold text-primary-dark hover:underline disabled:text-neutral-500 disabled:cursor-not-allowed"
                >
                    Resend Code {resendCooldown > 0 && `(in ${resendCooldown}s)`}
                </button>
                 <p>
                    <button onClick={onBackToLogin} className="text-xs text-neutral-500 hover:underline">Back to Login</button>
                </p>
            </div>
        </div>
    );
};

const ForgotPasswordForm: React.FC<{
    email: string; setEmail: (v: string) => void; onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean; onBackToLogin: () => void;
}> = ({ email, setEmail, onSubmit, isLoading, onBackToLogin }) => {
     return (
        <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-800 mb-2">Reset Password</h2>
            <p className="text-neutral-600 mb-6">Enter your email to receive a reset link.</p>
            <form className="space-y-4" onSubmit={onSubmit}>
                <InputField id="resetEmail" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                <AuthButton type="submit" isLoading={isLoading}>Send Reset Link</AuthButton>
            </form>
            <div className="mt-6 text-sm">
                <button onClick={onBackToLogin} className="font-semibold text-primary-dark hover:underline">Back to Login</button>
            </div>
        </div>
    );
}

export default StudentAuthPage;
