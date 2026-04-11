import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const email = body.credenciais?.email || body.email || '';
        const senha = body.credenciais?.senha || body.senha || '';

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AUTH_URL || 'https://seu-backend.onrender.com';

        const renderResponse = await fetch(`${backendUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha }),
        });

        if (!renderResponse.ok) {
            const errorText = await renderResponse.text();
            return NextResponse.json({ error: 'Credenciais inválidas', details: errorText }, { status: renderResponse.status });
        }

        const data = await renderResponse.json();

        // 🚀 A MÁGICA ACONTECE AQUI!
        // Lemos os cabeçalhos "Set-Cookie" que o Python mandou
        const backendCookies = renderResponse.headers.getSetCookie();

        let accessToken = '';
        let refreshToken = '';

        // Procuramos os tokens no meio dos textos dos cookies do backend
        backendCookies.forEach(cookieStr => {
            if (cookieStr.startsWith('access_token=')) {
                accessToken = cookieStr.split(';')[0].split('=')[1];
            }
            if (cookieStr.startsWith('refresh_token=')) {
                refreshToken = cookieStr.split(';')[0].split('=')[1];
            }
        });

        console.log('Tokens extraídos do cabeçalho:', {
            hasAccess: !!accessToken,
            hasRefresh: !!refreshToken
        });

        if (accessToken) {
            const cookieStore = await cookies();

            // Salva o Access Token na Vercel
            cookieStore.set({
                name: 'access_token',
                value: accessToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 15, // 15 minutos
            });

            // Salva o Refresh Token na Vercel
            if (refreshToken) {
                cookieStore.set({
                    name: 'refresh_token',
                    value: refreshToken,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7, // 7 dias
                });
            }
        }

        console.log('✅ Login bem-sucedido via Proxy. Cookies definidos.');

        return NextResponse.json({
            success: true,
            user: data.user || data // Previne erros caso a estrutura do JSON mude
        });

    } catch (error) {
        console.error('💥 Erro fatal no proxy:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}