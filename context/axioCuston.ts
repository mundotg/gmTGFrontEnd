import axios from 'axios';
import React from 'react';

const api =axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação, se disponível
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Interceptor para tratar erros de resposta
// api.interceptors.response.use(
//   (response) => response,
//   (error: { response: { data: any; }; request: any; message: any; }) => {
//     if (error.response) {
//       console.error('Erro na resposta:', error.response.data);
//     } else if (error.request) {
//       console.error('Erro na requisição:', error.request);
//     } else {
//       console.error('Erro geral:', error.message);
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
