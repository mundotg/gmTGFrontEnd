import { NextRequest } from 'next/server';
import { checkAuth } from './middleware/auth';

export function proxy(req: NextRequest) {
  return checkAuth(req);
}

export const config = {
  matcher: [
    '/dashboard',
    '/clouds',
    '/auth/login',
    '/auth/register',
    '/home/',
    '/home/conexao',
    '/home/consultas',
    '/home/configuracao',
    '/home/tabelas',
    '/home/ocr',  
    '/home/geradorImagens',
    '/home/sobre',
    '/home/tester',
    '/home/ai'
  ],
};