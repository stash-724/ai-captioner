import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { LogOut, Menu, Sparkles, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import ServerWakeBanner from './ServerWakeBanner'
import { buttonClasses } from './ui'

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
  }`

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-orange-600 text-white">
        <Sparkles className="size-4.5" aria-hidden />
      </span>
      AI Captioner
    </Link>
  )
}

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const links = (
    <>
      <NavLink to="/" end className={navLinkClass}>
        Feed
      </NavLink>
      <NavLink to="/search" className={navLinkClass}>
        Search
      </NavLink>
      {isAuthenticated && (
        <>
          <NavLink to="/create" className={navLinkClass}>
            Create
          </NavLink>
          <NavLink to="/me" className={navLinkClass}>
            My posts
          </NavLink>
        </>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {links}
          </nav>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Avatar name={user?.username} className="size-7 text-xs" />
                {user?.username}
              </span>
              <button type="button" onClick={handleLogout} className={buttonClasses('ghost', 'sm')}>
                <LogOut className="size-4" aria-hidden /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                Log in
              </Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={`${buttonClasses('ghost', 'sm')} sm:hidden`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-zinc-200 px-4 py-3 sm:hidden dark:border-zinc-800"
          onClick={(event) => event.target.closest('a') && setMenuOpen(false)}
        >
          <nav className="flex flex-col gap-1" aria-label="Main">
            {links}
          </nav>
          <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Avatar name={user?.username} className="size-7 text-xs" />
                  {user?.username}
                </span>
                <button type="button" onClick={handleLogout} className={buttonClasses('ghost', 'sm')}>
                  <LogOut className="size-4" aria-hidden /> Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className={buttonClasses('secondary', 'md')}>
                  Log in
                </Link>
                <Link to="/register" className={buttonClasses('primary', 'md')}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ServerWakeBanner />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Built with React, Express, MongoDB, Google Gemini and CLIP
      </footer>
    </div>
  )
}
