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
    alert('Local cache cleared.')
  }

  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: '#fff8f8',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button onClick={() => router.back()} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>The Archivist's Folio</h1>
        </div>
      </header>

      <section style={{padding: '96px 24px 32px'}}>
        <h2 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '48px', fontWeight: 700, marginBottom: '8px'}}>Settings</h2>
        <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '18px', color: '#4d4447'}}>The Archivist's Preferences</p>
      </section>

      <section style={{padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px'}}>

        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">translate</span>
            Linguistic Preferences
          </h3>
          <div style={{marginBottom: '20px'}}>
            <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', marginBottom: '4px'}}>Character Script</p>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447', marginBottom: '12px'}}>All lyrics are shown in Simplified Chinese</p>
            <div style={{display: 'flex', gap: '12px'}}>
              <button style={{
                padding: '8px 24px', backgroundColor: '#bc004b', color: '#fff',
                border: 'none', borderRadius: '8px', fontFamily: 'Work Sans, sans-serif',
                fontSize: '13px', cursor: 'pointer'
              }}>Simplified</button>
            </div>
          </div>
          <div>
            <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', marginBottom: '4px'}}>Translation Style</p>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447'}}>Literal translations via MyMemory API</p>
          </div>
        </div>

        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">inventory_2</span>
            Library Management
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #d0c3c7'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span className="material-symbols-outlined" style={{color: '#ab2c5d'}}>cloud_sync</span>
                <div>
                  <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', margin: 0}}>Cloud Sync</p>
                  <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447', margin: 0}}>Songs saved to Supabase across devices</p>
                </div>
              </div>
              <span style={{
                backgroundColor: '#bc004b', color: '#fff',
                padding: '4px 12px', borderRadius: '9999px',
                fontFamily: 'Work Sans, sans-serif', fontSize: '11px', fontWeight: 600
              }}>ON</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span className="material-symbols-outlined" style={{color: '#ab2c5d'}}>delete_sweep</span>
                <div>
                  <p style={{fontFamily: 'Newsreader, serif', fontSize: '18px', margin: 0}}>Clear Local Cache</p>
                  <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447', margin: 0}}>Remove all locally stored lyrics</p>
                </div>
              </div>
              <button onClick={clearCache} style={{
                backgroundColor: 'transparent', color: '#bc004b',
                border: '1px solid #bc004b', borderRadius: '8px',
                padding: '8px 16px', fontFamily: 'Work Sans, sans-serif',
                fontSize: '12px', cursor: 'pointer', fontWeight: 600
              }}>Clear</button>
            </div>
          </div>
        </div>

        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '22px', color: '#bc004b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="material-symbols-outlined">info</span>
            About
          </h3>
          <p style={{fontFamily: 'Newsreader, serif', fontSize: '16px', color: '#4d4447', lineHeight: 1.7}}>
            The Archivist's Folio translates Chinese song lyrics into Simplified Chinese, Pinyin, and English. Lyrics sourced from LRCLIB. Translations via MyMemory API.
          </p>
          <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#7f7478', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.1em'}}>Version 1.0 · Built with Next.js + Supabase</p>
        </div>

      </section>
    </main>
  )
}
