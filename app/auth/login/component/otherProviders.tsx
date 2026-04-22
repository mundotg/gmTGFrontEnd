
import { AuthProvider, LoginOptions } from '@/types';
import { Github, Facebook, AppWindow } from 'lucide-react';
import React, { useCallback } from 'react';

export interface OtherProvidersProps {
    login: (provider: AuthProvider, options?: LoginOptions) => Promise<boolean>;
    t: (key: string) => string;
}

export const OtherProviders = React.memo<OtherProvidersProps>(({ login }) => {
    const onGoogle = useCallback(() => void login("google"), [login]);
    const onGithub = useCallback(() => void login("github"), [login]);
    const onMicrosoft = useCallback(() => void login("microsoft"), [login]);

    const socialBtnClass = "flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm";

    return (
        <div className="flex gap-3 justify-center">
            <button type="button" onClick={onGoogle} className={socialBtnClass} title="Google">
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
            </button>

            <button type="button" onClick={onGithub} className={socialBtnClass} title="GitHub">
                <Github className="w-4 h-4" />
            </button>

            {/* MICROSOFT */}
            <button type="button" onClick={onMicrosoft} className={socialBtnClass} title="Microsoft">
                <AppWindow className="w-4 h-4 text-blue-500" />
            </button>
        </div>
    );
});

OtherProviders.displayName = "OtherProviders";

