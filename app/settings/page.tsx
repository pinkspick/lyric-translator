'use client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  function clearCache() {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('lyric_')) keys.push(key)
    }
    keys.forEach(k => localStorage.removeItem(k))
    alert('本地缓存已清除')
  }

  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '16px 24px'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button onClick={() => router.back()} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>乐译</h1>
        </div>
      </header>

      <section style={{padding: '96px 24px 32px'}}>
        <h2 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '48px', fontWeight: 700, marginBottom: '8px'}}>设置</h2>
        <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '18px', color: '#4d4447'}}>偏好设置</p>
      </section>

      <section style={{padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px'}}>

        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">translate</span>
            语言偏好
          </h3>
          <div style={{marginBottom: '20px'}}>
            <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', marginBottom: '4px'}}>文字类型</p>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447', marginBottom: '12px'}}>所有歌词显示为简体中文</p>
            <div style={{display: 'flex', gap: '12px'}}>
              <button style={{
                padding: '8px 24px', backgroundColor: '#bc004b', color: '#fff',
                border: 'none', borderRadius: '8px', fontFamily: 'Work Sans, sans-serif',
                fontSize: '13px', cursor: 'pointer'
              }}>简体中文</button>
            </div>
          </div>
          <div>
            <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', marginBottom: '4px'}}>翻译风格</p>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447'}}>通过 MyMemory API 进行字面翻译</p>
          </div>
        </div>

        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">palette</span>
            声调颜色
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {[
              {tone: '第一声', ex: 'ā', color: '#e53935', desc: '阴平'},
              {tone: '第二声', ex: 'á', color: '#fb8c00', desc: '阳平'},
              {tone: '第三声', ex: 'ǎ', color: '#f9a825', desc: '上声'},
              {tone: '第四声', ex: 'à', color: '#1e88e5', desc: '去声'},
              {tone: '轻声', ex: 'a', color: '#c07a8a', desc: '轻声'},
            ].map(t => (
              <div key={t.tone} style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: t.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 700
                }}>{t.ex}</span>
                <div>
                  <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '14px', fontWeight: 600}}>{t.tone}</span>
                  <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447', marginLeft: '8px'}}>{t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">inventory_2</span>
            档案管理
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #d0c3c7'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span className="material-symbols-outlined" style={{color: '#ab2c5d'}}>cloud_sync</span>
                <div>
                  <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', margin: 0}}>云同步</p>
                  <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447', margin: 0}}>歌曲通过 Supabase 跨设备保存</p>
                </div>
              </div>
              <span style={{
                backgroundColor: '#bc004b', color: '#fff',
                padding: '4px 12px', borderRadius: '9999px',
                fontFamily: 'Work Sans, sans-serif', fontSize: '11px', fontWeight: 600
              }}>开启</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span className="material-symbols-outlined" style={{color: '#ab2c5d'}}>delete_sweep</span>
                <div>
                  <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', margin: 0}}>清除本地缓存</p>
                  <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447', margin: 0}}>删除所有本地存储的歌词</p>
                </div>
              </div>
              <button onClick={clearCache} style={{
                backgroundColor: 'transparent', color: '#bc004b',
                border: '1px solid #bc004b', borderRadius: '8px',
                padding: '8px 16px', fontFamily: 'Work Sans, sans-serif',
                fontSize: '12px', cursor: 'pointer', fontWeight: 600
              }}>清除</button>
            </div>
          </div>
        </div>

        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">info</span>
            关于
          </h3>
          <p style={{fontFamily: 'Newsreader, serif', fontSize: '16px', color: '#4d4447', lineHeight: 1.7}}>
            乐译 将中文歌词翻译为简体中文、拼音和英文。歌词来源：LRCLIB。翻译：MyMemory API。
          </p>
          <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#7f7478', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.1em'}}>版本 1.0 · Next.js + Supabase</p>
        </div>


        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">account_circle</span>
            账户
          </h3>
          <button onClick={async () => {
            const { supabase } = await import('../../lib/supabase')
            await supabase.auth.signOut()
          }} style={{
            width: '100%', backgroundColor: 'transparent', color: '#bc004b',
            border: '1px solid #bc004b', borderRadius: '8px', padding: '14px',
            fontFamily: 'Work Sans, sans-serif', fontSize: '13px', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
          }}>退出登录</button>
        </div>

      </section>
    </main>
  )
}
