'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { colorPinyinLine } from '../../lib/toneColors'

type LyricResult = {
  title: string
  artist: string
  simplified: string[]
  pinyin: string[]
  english: string[]
}

type ViewMode = 'full' | 'pinyin' | 'hanzi'

type QuizQuestion = {
  character: string
  pinyin: string
  correctTone: number
}

export default function LyricsPage() {
  const [song, setSong] = useState<LyricResult | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('full')
  const [showQuiz, setShowQuiz] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(5)
  const [quizDone, setQuizDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('current_song')
    if (stored) setSong(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (!showQuiz || quizDone || answered !== null) return
    if (timeLeft <= 0) { handleAnswer(-1); return }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [showQuiz, timeLeft, answered, quizDone])

  function generateQuiz(song: LyricResult) {
    const toneMarks: Record<string, number> = {
      'ā':1,'ē':1,'ī':1,'ō':1,'ū':1,
      'á':2,'é':2,'í':2,'ó':2,'ú':2,
      'ǎ':3,'ě':3,'ǐ':3,'ǒ':3,'ǔ':3,
      'à':4,'è':4,'ì':4,'ò':4,'ù':4,
    }
    const qs: QuizQuestion[] = []
    for (let i = 0; i < song.simplified.length && qs.length < 10; i++) {
      const chars = song.simplified[i].split('')
      const syllables = song.pinyin[i].split(' ')
      for (let j = 0; j < syllables.length && qs.length < 10; j++) {
        const syl = syllables[j]
        let tone = 0
        for (const ch of syl) { if (toneMarks[ch]) { tone = toneMarks[ch]; break } }
        if (tone > 0 && chars[j]) {
          qs.push({ character: chars[j], pinyin: syl, correctTone: tone })
        }
      }
    }
    return qs.sort(() => Math.random() - 0.5).slice(0, 8)
  }

  function startQuiz() {
    if (!song) return
    const qs = generateQuiz(song)
    setQuestions(qs)
    setCurrentQ(0)
    setScore(0)
    setAnswered(null)
    setTimeLeft(5)
    setQuizDone(false)
    setShowQuiz(true)
  }

  function handleAnswer(tone: number) {
    if (answered !== null) return
    setAnswered(tone)
    if (tone === questions[currentQ]?.correctTone) setScore(s => s + 1)
    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        setQuizDone(true)
      } else {
        setCurrentQ(q => q + 1)
        setAnswered(null)
        setTimeLeft(5)
      }
    }, 1000)
  }

  async function saveSong() {
    if (!song) return
    const cacheKey = 'lyric_' + song.title.trim().toLowerCase()
    const json = JSON.stringify(song)
    localStorage.setItem(cacheKey, json)
    await supabase.from('songs').upsert({
      cache_key: cacheKey, data: json, updated_at: new Date().toISOString()
    }, { onConflict: 'cache_key' })
    alert('已保存！')
  }

  const toneColors: Record<number, string> = {
    1: '#e53935', 2: '#fb8c00', 3: '#f9a825', 4: '#1e88e5'
  }

  const viewButtons = [
    { mode: 'full' as ViewMode, label: '全文' },
    { mode: 'pinyin' as ViewMode, label: '拼音' },
    { mode: 'hanzi' as ViewMode, label: '汉字' },
  ]

  if (!song) return (
    <main style={{paddingTop: '120px', textAlign: 'center', color: '#4d4447'}}>
      <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px'}}>未加载歌曲</p>
      <button onClick={() => router.push('/')} style={{
        marginTop: '16px', backgroundColor: '#bc004b', color: '#fff',
        border: 'none', borderRadius: '8px', padding: '12px 24px',
        fontFamily: 'Work Sans, sans-serif', cursor: 'pointer'
      }}>搜索歌曲</button>
    </main>
  )

  if (showQuiz) return (
    <main style={{paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', padding: '24px'}}>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '16px 24px'
      }}>
        <button onClick={() => setShowQuiz(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
          <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
        </button>
        <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>声调测验</h1>
        <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447'}}>{currentQ + 1}/{questions.length}</span>
      </header>

      <div style={{paddingTop: '80px'}}>
        {quizDone ? (
          <div style={{textAlign: 'center', paddingTop: '60px'}}>
            <p style={{fontSize: '64px', marginBottom: '16px'}}>🎵</p>
            <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '36px', marginBottom: '8px'}}>测验完成！</h2>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '18px', color: '#bc004b', marginBottom: '32px'}}>
              得分: {score}/{questions.length}
            </p>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
              <button onClick={startQuiz} style={{
                backgroundColor: '#bc004b', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '12px 24px',
                fontFamily: 'Work Sans, sans-serif', cursor: 'pointer', fontSize: '14px'
              }}>再来一次</button>
              <button onClick={() => setShowQuiz(false)} style={{
                backgroundColor: '#fff0f4', color: '#bc004b', border: 'none',
                borderRadius: '8px', padding: '12px 24px',
                fontFamily: 'Work Sans, sans-serif', cursor: 'pointer', fontSize: '14px'
              }}>返回歌词</button>
            </div>
          </div>
        ) : questions[currentQ] ? (
          <div style={{textAlign: 'center'}}>
            <div style={{
              backgroundColor: '#fff0f4', borderRadius: '24px',
              padding: '48px 32px', marginBottom: '32px'
            }}>
              <p style={{
                fontFamily: 'Newsreader, serif', fontSize: '80px',
                fontWeight: 700, margin: '0 0 16px', color: '#25181e'
              }}>{questions[currentQ].character}</p>
              <p style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: '20px',
                color: '#bc004b', margin: 0, fontStyle: 'italic'
              }}>{questions[currentQ].pinyin}</p>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: '24px',
              gap: '8px'
            }}>
              {[5,4,3,2,1].map(n => (
                <div key={n} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: n <= timeLeft ? '#bc004b' : '#f4dce4'
                }} />
              ))}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              {[1,2,3,4].map(tone => {
                let bg = '#fff0f4'
                let color = '#25181e'
                if (answered !== null) {
                  if (tone === questions[currentQ].correctTone) { bg = toneColors[tone]; color = '#fff' }
                  else if (tone === answered) { bg = '#ffdad6'; color = '#93000a' }
                }
                return (
                  <button key={tone} onClick={() => handleAnswer(tone)} style={{
                    backgroundColor: bg, color, border: 'none',
                    borderRadius: '12px', padding: '20px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: '16px',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <span style={{fontSize: '24px', display: 'block', marginBottom: '4px'}}>
                      {tone === 1 ? 'ā' : tone === 2 ? 'á' : tone === 3 ? 'ǎ' : 'à'}
                    </span>
                    第{tone === 1 ? '一' : tone === 2 ? '二' : tone === 3 ? '三' : '四'}声
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )

  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '16px 24px'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <button onClick={() => router.push('/')} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>乐译</h1>
        </div>
        <div style={{display: 'flex', gap: '8px'}}>
          <button onClick={startQuiz} style={{
            backgroundColor: '#fff0f4', color: '#bc004b', border: 'none',
            borderRadius: '8px', padding: '8px 12px',
            fontFamily: 'Work Sans, sans-serif', fontSize: '12px', cursor: 'pointer'
          }}>测验</button>
          <button onClick={saveSong} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>bookmark_add</span>
          </button>
        </div>
      </header>

      <section style={{padding: '80px 24px 24px'}}>
        <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#b90c55', display: 'block', marginBottom: '8px'}}>正在播放</span>
        <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.1, marginBottom: '8px'}}>{song.title}</h2>
        <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '18px', color: '#ab2c5d', marginBottom: '24px'}}>{song.artist}</p>

        <div style={{display: 'flex', gap: '8px', marginBottom: '32px'}}>
          {viewButtons.map(btn => (
            <button key={btn.mode} onClick={() => setViewMode(btn.mode)} style={{
              padding: '8px 20px',
              backgroundColor: viewMode === btn.mode ? '#bc004b' : '#fff0f4',
              color: viewMode === btn.mode ? '#fff' : '#bc004b',
              border: 'none', borderRadius: '8px',
              fontFamily: 'Work Sans, sans-serif', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}>{btn.label}</button>
          ))}
        </div>
      </section>

      <section style={{padding: '0 24px'}}>
        {song.simplified.map((line, i) => {
          const colored = colorPinyinLine(song.pinyin[i] || '')
          return (
            <div key={i} style={{marginBottom: '32px'}}>
              <p style={{
                fontFamily: 'Newsreader, serif', fontSize: '22px',
                fontWeight: 700, color: '#25181e', marginBottom: '6px', lineHeight: 1.4
              }}>{line}</p>

              {viewMode !== 'hanzi' && (
                <p style={{marginBottom: '6px', lineHeight: 1.6}}>
                  {colored.map((syl, j) => (
                    <span key={j} style={{
                      fontFamily: 'Work Sans, sans-serif', fontSize: '13px',
                      color: syl.color, marginRight: '4px', fontStyle: 'italic'
                    }}>{syl.text}</span>
                  ))}
                </p>
              )}

              {viewMode === 'full' && (
                <p style={{
                  fontFamily: 'Newsreader, serif', fontSize: '12px',
                  color: '#4d4447', fontStyle: 'italic', lineHeight: 1.5
                }}>{song.english[i] || ''}</p>
              )}
            </div>
          )
        })}
      </section>
    </main>
  )
}
