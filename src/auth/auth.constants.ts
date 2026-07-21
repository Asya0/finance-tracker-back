export function accessSecret(): string {
  return process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me';
}

export function refreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me';
}
