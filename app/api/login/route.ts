import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        // ✅ CORREÇÃO AQUI: Tipamos a variável para avisar o TypeScript
        let credentials: { token?: string } = {};

        // 1. Tenta ler o JSON com segurança. 
        // Se o frontend mandar a requisição completamente vazia, não vai quebrar o servidor.
        try {
            credentials = await request.json();
        } catch (err) {
            // Se cair aqui, é porque o body veio vazio. Tudo bem, seguimos em frente.
            console.log('Body vazio recebido.');
        }

        const token = credentials?.token;
        const cookieStore = await cookies();

        // 2. CENÁRIO DE LOGOUT: O token veio vazio (ou null, ou undefined)
        if (!token) {
            console.log('🧹 Nenhum token recebido. Apagando o cookie...', credentials);

            // O Next.js tem uma função própria para deletar cookies de forma segura
            cookieStore.delete('bk_access_token');

            // Retornamos sucesso (Status 200), pois apagar o cookie deu certo!
            return NextResponse.json({
                success: true,
                message: 'Sessão encerrada e cookie apagado.'
            });
        }

        // 3. CENÁRIO DE LOGIN: O token chegou perfeitamente
        console.log('🔍 Salvando novo token no cookie...');
        cookieStore.set({
            name: 'bk_access_token',
            value: token,
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
        });

        return NextResponse.json({
            success: true,
            message: 'Recebido e salvo no servidor com sucesso!',
        });

    } catch (error) {
        console.error('Erro fatal na rota de sessão:', error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}