  export const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  export const getPasswordStrengthText = (passwordStrength:number) => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: 'Muito fraca', color: 'text-red-500', width: 'w-1/4', bg: 'bg-red-500' };
      case 2:
        return { text: 'Fraca', color: 'text-orange-500', width: 'w-2/4', bg: 'bg-orange-500' };
      case 3:
      case 4:
        return { text: 'Boa', color: 'text-green-500', width: 'w-3/4', bg: 'bg-green-500' };
      case 5:
        return { text: 'Muito forte', color: 'text-blue-500', width: 'w-full', bg: 'bg-blue-500' };
      default:
        return { text: 'Digite uma palavra-passe', color: 'text-gray-400', width: 'w-0', bg: 'bg-gray-300' };
    }
  };