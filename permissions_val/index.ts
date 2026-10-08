export function hasPermission(
  userPermissions?: string[],
  required?: string | string[]
): boolean {
  if (!required) return true;
  if (!userPermissions || userPermissions.length === 0) return false;

  // Super admin passa em tudo
  if (userPermissions.includes("admin:*")) return true;

  const reqList = Array.isArray(required) ? required : [required];
  const prefixes = userPermissions
    .filter((p) => p.endsWith("*"))
    .map((p) => p.slice(0, -1));

  return reqList.some((req) => {
    if (userPermissions.includes(req)) return true;
    return prefixes.some((pfx) => req.startsWith(pfx));
  });
}