'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendMagicLink() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/'
      }
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#fff8f8',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{maxWidth: '400px', width: '100%', textAlign: 'center'}}>
        <h1 style={{
          fontFamily: 'Newsreader, serif', fontStyle: 'italic',
          fontSize: '48px', color: '#bc004b', marginBottom: '8px'
        }}>乐译</h1>
        <p style={{
          fontFamily: 'Work Sans, sans-serif', fontSize: '12px',
          textTransform: 'uppercase', letterSpacing: '0.2em',
          color: '#4d4447', marginBottom: '48px'
        }}>汉字 · 拼音 · 英文</p>

        {sent ? (
          <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
            <p style={{fontSize: '48px', marginBottom: '16px'}}>📧</p>
            <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '24px', marginBottom: '12px'}}>请查看邮箱</h2>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '14px', color: '#4d4447', lineHeight: 1.6}}>
              我们已向 <strong>{email}</strong> 发送了登录链接，点击链接即可登录。
            </p>
          </div>
        ) : (
          <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
            <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '24px', marginBottom: '8px'}}>登录</h2>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447', marginBottom: '24px'}}>
              输入邮箱，我们将发送登录链接
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
              placeholder="your@email.com"
              style={{
                width: '100%', backgroundColor: '#fff', border: '1px solid #d0c3c7',
                borderRadius: '8px', padding: '14px 16px', marginBottom: '12px',
                fontFamily: 'Newsreader, serif', fontSize: '16px', boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            {error && <p style={{color: '#93000a', fontSize: '13px', marginBottom: '12px', fontFamily: 'Work Sans, sans-serif'}}>{error}</p>}
            <button
              onClick={sendMagicLink}
              disabled={loading || !email.trim()}
              style={{
                width: '100%', backgroundColor: loading ? '#d0c3c7' : '#bc004b',
                color: '#fff', border: 'none', borderRadius: '8px', padding: '14px',
                fontFamily: 'Work Sans, sans-serif', fontSize: '14px', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
              }}
            >
              {loading ? '发送中...' : '发送登录链接'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
