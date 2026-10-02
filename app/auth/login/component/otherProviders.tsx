
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
    const onGitlab = useCallback(() => void login("gitlab"), [login]);
    const onMicrosoft = useCallback(() => void login("microsoft"), [login]);
    const onAuth0 = useCallback(() => void login("auth0"), [login]);

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

            <button type="button" onClick={onGitlab} className={socialBtnClass} title="GitLab">
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true" fill="#E24329">
                    <path d="M22.65 14.39L20.6 8.08a.78.78 0 00-.28-.39.75.75 0 00-.47-.14.77.77 0 00-.46.16.83.83 0 00-.28.4L17.7 12.4H6.3L4.89 8.11a.8.8 0 00-.28-.4.77.77 0 00-.46-.16.75.75 0 00-.47.14.78.78 0 00-.28.39l-2.05 6.31a.8.8 0 00.29.89l10.02 7.28a.79.79 0 00.94 0l10.02-7.28a.8.8 0 00.29-.89z" />
                </svg>
            </button>

            {/* MICROSOFT */}
            <button type="button" onClick={onMicrosoft} className={socialBtnClass} title="Microsoft">
                <AppWindow className="w-4 h-4 text-blue-500" />
            </button>

            {/* AUTH0 */}
            <button type="button" onClick={onAuth0} className={socialBtnClass} title="Auth0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true" fill="#EB5424">
                    <path d="M21.98 12.01c0-.46-.06-.91-.18-1.34L12 12.01l9.8 1.34c.12-.43.18-.88.18-1.34zM12 2.01c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
            </button>
        </div>
    );
});

OtherProviders.displayName = "OtherProviders";

