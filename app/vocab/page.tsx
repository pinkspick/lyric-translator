'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type VocabItem = {
  word: string
  pinyin: string
  addedAt: string
}

export default function VocabPage() {
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { loadVocab() }, [])

  async function loadVocab() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('vocab')
          .select('word, pinyin, added_at')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false })
        if (data && data.length > 0) {
          setVocab(data.map((v: any) => ({ word: v.word, pinyin: v.pinyin, addedAt: v.added_at })))
          setLoading(false)
          return
        }
      }
    } catch {}
    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('vocab_list') || '[]')
    setVocab(local.reverse())
    setLoading(false)
  }

  async function deleteWord(word: string) {
    const updated = vocab.filter(v => v.word !== word)
    setVocab(updated)
    localStorage.setItem('vocab_list', JSON.stringify(updated))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('vocab').delete().eq('user_id', user.id).eq('word', word)
      }
    } catch {}
  }

  const toneMarks: Record<string, number> = {
    'ā':1,'ē':1,'ī':1,'ō':1,'ū':1,
    'á':2,'é':2,'í':2,'ó':2,'ú':2,
    'ǎ':3,'ě':3,'ǐ':3,'ǒ':3,'ǔ':3,
    'à':4,'è':4,'ì':4,'ò':4,'ù':4,
  }
  const toneColors: Record<number, string> = {
    1: '#e53935', 2: '#fb8c00', 3: '#f9a825', 4: '#1e88e5', 0: '#c07a8a'
  }

  function getPinyinColor(py: string): string {
    for (const ch of py) {
      if (toneMarks[ch]) return toneColors[toneMarks[ch]]
    }
    return toneColors[0]
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
        <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4d4447', display: 'block', marginBottom: '8px'}}>词汇学习</span>
        <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '48px', fontWeight: 700, lineHeight: 1.1, marginBottom: '8px'}}>生词本</h2>
        <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '18px', color: '#4d4447'}}>{vocab.length} 个词汇</p>
      </section>

      <section style={{padding: '0 24px'}}>
        {loading && <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: '#4d4447'}}>加载中...</p>}

        {!loading && vocab.length === 0 && (
          <div style={{textAlign: 'center', padding: '48px 0'}}>
            <span className="material-symbols-outlined" style={{fontSize: '64px', color: '#d0c3c7', display: 'block', marginBottom: '16px'}}>menu_book</span>
            <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#4d4447'}}>生词本为空</p>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#7f7478', marginTop: '8px'}}>完成声调测验后，将难词添加到生词本</p>
          </div>
        )}

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
          {vocab.map((item) => (
            <div key={item.word} style={{
              backgroundColor: '#fff0f4', borderRadius: '16px', padding: '24px',
              position: 'relative'
            }}>
              <button onClick={() => deleteWord(item.word)} style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px'
              }}>
                <span className="material-symbols-outlined" style={{fontSize: '18px', color: '#d0c3c7'}}>close</span>
              </button>
              <p style={{
                fontFamily: 'Newsreader, serif', fontSize: '40px',
                fontWeight: 700, margin: '0 0 8px', color: '#25181e'
              }}>{item.word}</p>
              <p style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: '14px',
                color: getPinyinColor(item.pinyin), margin: '0 0 4px', fontWeight: 600
              }}>{item.pinyin}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
