import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import AuthCard from '../components/AuthCard'
import { Alert, Button, Field } from '../components/ui'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors the backend's validation so most mistakes are caught before submitting
function validate({ username, email, password }) {
  const errors = {}
  if (!username.trim()) errors.username = 'Choose a username.'
  if (!EMAIL_REGEX.test(email)) errors.email = 'Enter a valid email address.'
  if (password.length < 6) errors.password = 'Use at least 6 characters.'
  return errors
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const errors = validate(form)
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  const touch = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ username: true, email: true, password: true })
    if (Object.keys(errors).length > 0) return

    setError(null)
    setSubmitting(true)
    try {
      await register({ ...form, username: form.username.trim() })
      navigate('/create', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="Upload photos and get captions in seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-orange-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Alert>{error}</Alert>}
        <Field
          label="Username"
          autoComplete="username"
          value={form.username}
          onChange={update('username')}
          onBlur={touch('username')}
          error={touched.username && errors.username}
          autoFocus
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          onBlur={touch('email')}
          error={touched.email && errors.email}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          onBlur={touch('password')}
          error={touched.password && errors.password}
          hint="At least 6 characters."
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthCard>
  )
}
