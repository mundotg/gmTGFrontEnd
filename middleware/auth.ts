import { NextRequest, NextResponse } from 'next/server';

export function checkAuth(req: NextRequest, protectedRoutes: string[]) {
  const token = req.cookies.get('access_token')?.value;
  const { pathname } = req.nextUrl;

  //   console.log('Middleware checkAuth - URL:', req.url);
  // console.log('Pathname:', pathname, "token: ",token);
  //   console.log('Token:', token);
  //   console.log('Protected Routes:', protectedRoutes);

  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isPublicHome = pathname === '/';

  //   console.log('Is Protected Route?', isProtectedRoute);
  //   console.log('Is Public Home?', isPublicHome);

  if (!token && isProtectedRoute) {
    console.log('No token and trying to access protected route. Redirecting to ', pathname);
    if (pathname.includes('auth')) {
      // console.log('Redirecting to /auth/login');
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

  // if (token && isPublicHome) {
  //     console.log('Token found and trying to access public home. Redirecting to /dashboard');
  //   return NextResponse.redirect(new URL('/', req.url));
  // }

  //   console.log('Access allowed');
  return NextResponse.next();
}

