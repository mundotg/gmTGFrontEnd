/**
 * Calcula a força da senha de 0 a 5 baseada em critérios de complexidade
 */
export const checkPasswordStrength = (password: string): number => {
  if (!password) return -1; // Estado inicial/vazio
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

/**
 * Retorna as propriedades visuais e as chaves de tradução baseadas na força
 */
export const getPasswordStrengthText = (passwordStrength: number) => {
  switch (passwordStrength) {
    case 0:
    case 1:
      return { 
        text: 'auth.strengthVeryWeak', 
        color: 'text-red-500', 
        width: 'w-1/5', 
        bg: 'bg-red-500' 
      };
    case 2:
      return { 
        text: 'auth.strengthWeak', 
        color: 'text-orange-500', 
        width: 'w-2/5', 
        bg: 'bg-orange-500' 
      };
    case 3:
      return { 
        text: 'auth.strengthMedium', 
        color: 'text-yellow-500', 
        width: 'w-3/5', 
        bg: 'bg-yellow-500' 
      };
    case 4:
      return { 
        text: 'auth.strengthGood', 
        color: 'text-green-500', 
        width: 'w-4/5', 
        bg: 'bg-green-500' 
      };
    case 5:
      return { 
        text: 'auth.strengthStrong', 
        color: 'text-blue-600', 
        width: 'w-full', 
        bg: 'bg-blue-600' 
      };
    default:
      return { 
        text: 'auth.strengthPrompt', 
        color: 'text-gray-400', 
        width: 'w-0', 
        bg: 'bg-gray-200' 
      };
  }
};