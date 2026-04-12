import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const LOGIN_INITIAL_STATE = {
  email: '',
  password: '',
}

const REGISTER_INITIAL_STATE = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function AuthPage({ onAuthSuccess }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loginData, setLoginData] = useState(LOGIN_INITIAL_STATE)
  const [registerData, setRegisterData] = useState(REGISTER_INITIAL_STATE)

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const onLoginInput = (event) => {
    const { name, value } = event.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

  const onRegisterInput = (event) => {
    const { name, value } = event.target
    setRegisterData((prev) => ({ ...prev, [name]: value }))
  }

  const submitLogin = (event) => {
    event.preventDefault()
    if (!loginData.email || !loginData.password) {
      setError('Please complete both login fields.')
      return
    }

    onAuthSuccess({ email: loginData.email })
    navigate('/')
  }

  const submitRegister = (event) => {
    event.preventDefault()

    if (
      !registerData.fullName ||
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

    onAuthSuccess({
      fullName: registerData.fullName,
      email: registerData.email,
    })
    navigate('/')
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
              />
            </label>

            <button type="submit" className="primary-btn">
              Login
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitRegister}>
            <label>
              Full name
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                value={registerData.fullName}
                onChange={onRegisterInput}
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
              />
            </label>

            <button type="submit" className="primary-btn">
              Register
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
