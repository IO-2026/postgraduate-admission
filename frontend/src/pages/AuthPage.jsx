import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../services/authApi'

const LOGIN_INITIAL_STATE = {
  email: '',
  password: '',
}

const REGISTER_INITIAL_STATE = {
  name: '',
  surname: '',
  telNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function AuthPage({ onAuthSuccess }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginData, setLoginData] = useState(LOGIN_INITIAL_STATE)
  const [registerData, setRegisterData] = useState(REGISTER_INITIAL_STATE)

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setInfo('')
  }

  const onLoginInput = (event) => {
    const { name, value } = event.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

  const onRegisterInput = (event) => {
    const { name, value } = event.target
    setRegisterData((prev) => ({ ...prev, [name]: value }))
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    if (!loginData.email || !loginData.password) {
      setError('Please complete both login fields.')
      return
    }

    setError('')
    setInfo('')
    setIsSubmitting(true)

    try {
      const response = await loginUser({
        email: loginData.email.trim(),
        username: loginData.email.trim(),
        password: loginData.password,
      })

      onAuthSuccess({ email: loginData.email.trim() }, response)
      navigate('/')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitRegister = async (event) => {
    event.preventDefault()

    if (
      !registerData.name ||
      !registerData.surname ||
      !registerData.telNumber ||
      !registerData.email ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      setError('Please complete all registration fields.')
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setInfo('')
    setIsSubmitting(true)

    try {
      await registerUser({
        name: registerData.name.trim(),
        surname: registerData.surname.trim(),
        telNumber: registerData.telNumber.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
      })

      const loginResponse = await loginUser({
        email: registerData.email.trim(),
        username: registerData.email.trim(),
        password: registerData.password,
      })

      onAuthSuccess(
        {
          name: registerData.name.trim(),
          surname: registerData.surname.trim(),
          fullName: `${registerData.name.trim()} ${registerData.surname.trim()}`,
          telNumber: registerData.telNumber.trim(),
          email: registerData.email.trim(),
        },
        loginResponse,
      )
      navigate('/')
    } catch (requestError) {
      setError(requestError.message)
      setInfo('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-view">
      <div className="auth-card">
        <div className="auth-switch" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
            role="tab"
            aria-selected={mode === 'register'}
          >
            Register
          </button>
        </div>

        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to open your admission home page.'
            : 'Create a profile to access the admission portal.'}
        </p>

        {error ? <p className="form-error">{error}</p> : null}
        {info ? <p className="form-info">{info}</p> : null}

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={loginData.email}
                onChange={onLoginInput}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={loginData.password}
                onChange={onLoginInput}
                disabled={isSubmitting}
              />
            </label>

            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitRegister}>
            <label>
              Name
              <input
                type="text"
                name="name"
                autoComplete="given-name"
                value={registerData.name}
                onChange={onRegisterInput}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Surname
              <input
                type="text"
                name="surname"
                autoComplete="family-name"
                value={registerData.surname}
                onChange={onRegisterInput}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Telephone number
              <input
                type="tel"
                name="telNumber"
                autoComplete="tel"
                value={registerData.telNumber}
                onChange={onRegisterInput}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={registerData.email}
                onChange={onRegisterInput}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                value={registerData.password}
                onChange={onRegisterInput}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={registerData.confirmPassword}
                onChange={onRegisterInput}
                disabled={isSubmitting}
              />
            </label>

            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Register'}
            </button>
          </form>
        )}

        <Link className="text-btn" to="/">
          Back to home gate
        </Link>
      </div>
    </section>
  )
}

export default AuthPage
