export function hasPermission(
  userPermissions?: string[],
  required?: string | string[]
) {
  if (!required) return true;
  if (!userPermissions) return false;

  return Array.isArray(required)
    ? required.some(p => userPermissions.includes(p))
    : userPermissions.includes(required);
}