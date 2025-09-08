import { NextRequest, NextResponse } from 'next/server';

export function checkAuth(req: NextRequest, protectedRoutes: string[]) {
  const token = req.cookies.get('access_token')?.value;
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.includes(pathname);

  // if (req.url.includes('/home')) {
  //   // console.log('Requisição para home:', req.url);
  //   // console.log('Referer:', req.headers.get('referer'));
  // }

  if (!token && isProtectedRoute) {
    if (pathname.includes('auth')) {
      return NextResponse.next();
    }
    if (!pathname.includes('auth')) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
  }
  if (pathname.includes('auth')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

