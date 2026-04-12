import { NextRequest, NextResponse } from 'next/server';

export function checkAuth(req: NextRequest) {
  const token = req.cookies.get('bk_access_token')?.value;

  // console.log('Verificando autenticação para:', req.cookies);

  // console.log('Token encontrado:', token);
  const { pathname } = req.nextUrl;

  // Identifica se é uma rota de autenticação (login, register, etc)
  const isAuthRoute = pathname.startsWith('/auth');

  // CENÁRIO 1: Usuário NÃO está logado
  if (!token) {
    if (isAuthRoute) {
      return NextResponse.next(); // Pode acessar o login/register
    }
    // Qualquer outra rota do matcher sem token -> redireciona pro login
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // CENÁRIO 2: Usuário ESTÁ logado
  if (isAuthRoute) {
    // Se tentar acessar a tela de login já estando logado, manda pra home
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Se tem token e está acessando rota protegida -> permite
  return NextResponse.next();
}