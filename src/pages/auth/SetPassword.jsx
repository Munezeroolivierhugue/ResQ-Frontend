import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    navigate(token ? `/register?token=${encodeURIComponent(token)}` : '/register', { replace: true })
  }, [])

  return null
}
