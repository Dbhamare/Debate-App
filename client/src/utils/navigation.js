export function getDashboardPath(user) {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (user?.role === 'instructor' || (Number(user?.userID) >= 501 && Number(user?.userID) <= 600)) {
    return '/instructor/dashboard';
  }
  return '/dashboard';
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function getHomePath(user = getCurrentUser()) {
  const token = localStorage.getItem('token');
  return token && user ? getDashboardPath(user) : '/';
}
