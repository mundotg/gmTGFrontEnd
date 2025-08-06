import { NextRequest } from 'next/server';
import { checkAuth } from './middleware/auth';

export function middleware(req: NextRequest) {
  return checkAuth(req,config.matcher)
}

// Define onde o middleware será aplicado
export const config = {
  matcher: ['/','/dashboard','/auth/login','/auth/register',"/home/","/home/conexao","/home/consultas",],
};
