import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

// Pages that need a logged-in user; remembers where to return after login
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

// Login/register pages are pointless once logged in. Only redirect users who arrive
// already logged in: after a successful login or sign-up the page navigates itself,
// and redirecting here as well would race it and send the user to the wrong place.
export function GuestRoute() {
  const { isAuthenticated } = useAuth()
  const [loggedInOnArrival] = useState(isAuthenticated)
  if (loggedInOnArrival) return <Navigate to="/" replace />
  return <Outlet />
}
