const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * Makes an authenticated API request using HttpOnly Cookies.
 * Uses credentials: 'include' so cookies are automatically sent with cross-origin requests.
 */
export async function apiFetch(endpoint, options = {}, isRetry = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  // Handle 401 Unauthorized with automatic token refresh via HttpOnly refresh cookie
  if (response.status === 401 && !isRetry && !endpoint.startsWith('/auth/')) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshResponse.ok) {
        // Retry original request once after cookie refresh succeeds
        return apiFetch(endpoint, options, true);
      }
    } catch {
      // Refresh request failed silently
    }
  }

  // Safe JSON/Text decoding
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = (data && data.message) || `HTTP error ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Auth API: Register a new user
 */
export async function registerUser({ username, email, password, fullName }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, fullName }),
  });
}

/**
 * Auth API: Login with username/email and password
 */
export async function loginUser({ usernameOrEmail, password }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usernameOrEmail, password }),
  });
}

/**
 * Auth API: Refresh access token via HttpOnly refresh cookie
 */
export async function refreshAccessToken() {
  return apiFetch('/auth/refresh', {
    method: 'POST',
  });
}

/**
 * Auth API: Logout (clears server-side cookies & refresh token)
 */
export async function logoutUser() {
  return apiFetch('/auth/logout', {
    method: 'POST',
  });
}

/**
 * Auth API: Get current user profile
 */
export async function getCurrentUser() {
  return apiFetch('/auth/me');
}

/**
 * Test API: Hit a test endpoint
 */
export async function testEndpoint(path) {
  return apiFetch(`/test/${path}`);
}

/**
 * Attendance API: Submit daily attendance
 */
export async function submitAttendance({ attendanceDate, status, notes, groupId }) {
  return apiFetch('/attendance/submit', {
    method: 'POST',
    body: JSON.stringify({ attendanceDate, status, notes, groupId }),
  });
}

/**
 * Attendance API: Get today's attendance for current user
 */
export async function getTodayAttendance() {
  return apiFetch('/attendance/today');
}

/**
 * Attendance API: Get user's attendance history
 */
export async function getMyAttendanceHistory() {
  return apiFetch('/attendance/my');
}

/**
 * Admin API: Get all system users
 */
export async function getAllUsers() {
  return apiFetch('/admin/users');
}

/**
 * Admin API: Register/Create a new user account
 */
export async function adminCreateUser({ username, email, password, fullName, roles }) {
  return apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, fullName, roles }),
  });
}

/**
 * Admin API: Get all groups
 */
export async function getAdminGroups() {
  return apiFetch('/admin/groups');
}

/**
 * Admin API: Create a new group
 */
export async function createGroup({ name, description }) {
  return apiFetch('/admin/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

/**
 * Admin API: Update existing group
 */
export async function updateGroup(id, { name, description }) {
  return apiFetch(`/admin/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description }),
  });
}

/**
 * Admin API: Delete a group
 */
export async function deleteGroup(id) {
  return apiFetch(`/admin/groups/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Admin API: Add user to a group
 */
export async function addUserToGroup(groupId, userId) {
  return apiFetch(`/admin/groups/${groupId}/members/${userId}`, {
    method: 'POST',
  });
}

/**
 * Admin API: Remove user from a group
 */
export async function removeUserFromGroup(groupId, userId) {
  return apiFetch(`/admin/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
}

/**
 * Admin API: Get attendance summary report
 */
export async function getAttendanceSummary({ groupId, startDate, endDate } = {}) {
  const query = new URLSearchParams();
  if (groupId) query.append('groupId', groupId);
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/attendance/admin/summary${queryString}`);
}

/**
 * Admin API: Get detailed attendance records
 */
export async function getAttendanceRecords({ groupId, startDate, endDate } = {}) {
  const query = new URLSearchParams();
  if (groupId) query.append('groupId', groupId);
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/attendance/admin/records${queryString}`);
}

