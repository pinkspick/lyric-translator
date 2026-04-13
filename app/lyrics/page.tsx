'use client'
import { useState, useEffect, useRef } from 'react'
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

type SearchResult = {
  id: number
  title: string
  artist: string
  album: string
  hasLyrics: boolean
}

type QuizQuestion = {
  word: string
  pinyin: string
  tone1: number
  tone2: number
}

type QuizResult = {
  question: QuizQuestion
  chosenTone1: number
  chosenTone2: number
  correct: boolean
}

const toneColors: Record<number, string> = {
  1: '#e53935', 2: '#fb8c00', 3: '#2e7d32', 4: '#1e88e5', 0: '#c07a8a'
}

const toneMarks: Record<string, number> = {
  'ā':1,'ē':1,'ī':1,'ō':1,'ū':1,'Ā':1,'Ē':1,'Ī':1,'Ō':1,'Ū':1,
  'á':2,'é':2,'í':2,'ó':2,'ú':2,'Á':2,'É':2,'Í':2,'Ó':2,'Ú':2,
  'ǎ':3,'ě':3,'ǐ':3,'ǒ':3,'ǔ':3,'Ǎ':3,'Ě':3,'Ǐ':3,'Ǒ':3,'Ǔ':3,
  'à':4,'è':4,'ì':4,'ò':4,'ù':4,'À':4,'È':4,'Ì':4,'Ò':4,'Ù':4,
}

const toneSymbols = ['', 'ā', 'á', 'ǎ', 'à']
const toneNames = ['', '一', '二', '三', '四']

function getSyllableTone(syl: string): number {
  for (const ch of syl) { if (toneMarks[ch]) return toneMarks[ch] }
  return 0
}

export default function LyricsPage() {
  const [song, setSong] = useState<LyricResult | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('full')
  const [showQuiz, setShowQuiz] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showWrongLyrics, setShowWrongLyrics] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loadingAlternate, setLoadingAlternate] = useState(false)
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [stage, setStage] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)
  const [stageResults, setStageResults] = useState<QuizResult[]>([])
  const [answered, setAnswered] = useState<{t1: number, t2: number} | null>(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const STAGE_SIZE = 10
  const stageQuestions = allQuestions.slice(stage * STAGE_SIZE, (stage + 1) * STAGE_SIZE)
  const totalStages = Math.ceil(allQuestions.length / STAGE_SIZE)

  useEffect(() => {
    const stored = localStorage.getItem('current_song')
    if (stored) {
      const parsed = JSON.parse(stored)
      setSong(parsed)
      if (parsed.title) {
        fetch('/api/search?q=' + encodeURIComponent(parsed.title))
          .then(r => r.json()).then(d => setSearchResults(d.results || [])).catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (!showQuiz || showSummary || answered !== null) return
    if (timeLeft <= 0) { handleAnswer(0, 0); return }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [showQuiz, timeLeft, answered, showSummary])

  function extractQuizWords(song: LyricResult): QuizQuestion[] {
    const qs: QuizQuestion[] = []
    const seen = new Set<string>()
    for (let i = 0; i < song.simplified.length; i++) {
      const chars = song.simplified[i]
      const syllables = song.pinyin[i]?.split(' ') || []
      for (let j = 0; j < syllables.length - 1; j++) {
        const word = chars.slice(j, j + 2)
        if (word.length < 2 || seen.has(word) || !/[\u4e00-\u9fff]/.test(word)) continue
        const t1 = getSyllableTone(syllables[j])
        const t2 = getSyllableTone(syllables[j + 1])
        if (t1 === 0 || t2 === 0) continue
        seen.add(word)
        qs.push({ word, pinyin: syllables[j] + ' ' + syllables[j + 1], tone1: t1, tone2: t2 })
      }
    }
    return qs.sort(() => Math.random() - 0.5)
  }

  function startQuiz() {
    if (!song) return
    const qs = extractQuizWords(song)
    setAllQuestions(qs)
    setStage(0)
    setCurrentQ(0)
    setStageResults([])
    setAnswered(null)
    setTimeLeft(10)
    setShowSummary(false)
    setShowQuiz(true)
  }

  function handleAnswer(t1: number, t2: number) {
    if (answered !== null) return
    if (timerRef.current) clearTimeout(timerRef.current)
    const q = stageQuestions[currentQ]
    const correct = t1 === q.tone1 && t2 === q.tone2
    setAnswered({ t1, t2 })
    const newResults = [...stageResults, { question: q, chosenTone1: t1, chosenTone2: t2, correct }]
    setStageResults(newResults)
    setTimeout(() => {
      if (currentQ + 1 >= stageQuestions.length) {
        setShowSummary(true)
      } else {
        setCurrentQ(q => q + 1)
        setAnswered(null)
        setTimeLeft(10)
      }
    }, 1200)
  }

  function nextStage() {
    setStage(s => s + 1)
    setCurrentQ(0)
    setStageResults([])
    setAnswered(null)
    setTimeLeft(10)
    setShowSummary(false)
  }

  async function saveVocab(word: string, pinyin: string) {
    const existing = JSON.parse(localStorage.getItem('vocab_list') || '[]')
    if (!existing.find((v: any) => v.word === word)) {
      existing.push({ word, pinyin, addedAt: new Date().toISOString() })
      localStorage.setItem('vocab_list', JSON.stringify(existing))
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('vocab').upsert({ user_id: user.id, word, pinyin, added_at: new Date().toISOString() }, { onConflict: 'user_id,word' })
        }
      } catch {}
      alert(word + ' 已添加到生词本')
    } else { alert(word + ' 已在生词本中') }
  }

  async function saveSong() {
    if (!song) return
    const cacheKey = 'lyric_' + song.title.trim().toLowerCase()
    const json = JSON.stringify(song)
    localStorage.setItem(cacheKey, json)
    await supabase.from('songs').upsert({ cache_key: cacheKey, data: json, updated_at: new Date().toISOString() }, { onConflict: 'cache_key' })
    alert('已保存！')
  }

  async function loadAlternate(track: SearchResult) {
    setLoadingAlternate(true)
    setShowWrongLyrics(false)
    const res = await fetch('/api/lyrics?q=' + encodeURIComponent(track.title + ' ' + track.artist))
    const data = await res.json()
    if (res.ok) {
      const finalResult = { ...data, title: track.title, artist: track.artist }
      setSong(finalResult)
      const cacheKey = 'lyric_' + (song?.title || track.title).trim().toLowerCase()
      const json = JSON.stringify(finalResult)
      localStorage.setItem(cacheKey, json)
      localStorage.setItem('current_song', json)
      try { await supabase.from('songs').upsert({ cache_key: cacheKey, data: json, updated_at: new Date().toISOString() }, { onConflict: 'cache_key' }) } catch {}
    }
    setLoadingAlternate(false)
  }

  const viewButtons = [
    { mode: 'full' as ViewMode, label: '全文' },
    { mode: 'pinyin' as ViewMode, label: '拼音' },
    { mode: 'hanzi' as ViewMode, label: '汉字' },
  ]

  if (!song) return (
    <main style={{paddingTop: '120px', textAlign: 'center'}}>
      <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#4d4447'}}>未加载歌曲</p>
      <button onClick={() => router.push('/')} style={{marginTop: '16px', backgroundColor: '#bc004b', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Work Sans, sans-serif', cursor: 'pointer'}}>搜索歌曲</button>
    </main>
  )

  // SUMMARY SCREEN
  if (showQuiz && showSummary) {
    const correct = stageResults.filter(r => r.correct).length
    const isLastStage = stage + 1 >= totalStages
    return (
      <main style={{maxWidth: '700px', margin: '0 auto', paddingBottom: '120px'}}>
        <header style={{position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px'}}>
          <button onClick={() => { setShowQuiz(false); setShowSummary(false) }} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>
            第 {stage + 1} 关 结果
          </h1>
          <span style={{width: '40px'}} />
        </header>
        <div style={{padding: '80px 24px 24px', textAlign: 'center'}}>
          <p style={{fontSize: '56px', marginBottom: '8px'}}>{correct / stageResults.length >= 0.8 ? '🏆' : correct / stageResults.length >= 0.5 ? '👏' : '💪'}</p>
          <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '32px', marginBottom: '4px'}}>{correct} / {stageResults.length} 正确</h2>
          <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447', marginBottom: '8px'}}>第 {stage + 1} 关 / 共 {totalStages} 关</p>
          <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#bc004b', marginBottom: '32px', fontWeight: 600}}>正确率 {Math.round(correct / stageResults.length * 100)}%</p>

          <div style={{display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap'}}>
            <button onClick={startQuiz} style={{backgroundColor: '#fff0f4', color: '#bc004b', border: 'none', borderRadius: '8px', padding: '12px 20px', fontFamily: 'Work Sans, sans-serif', cursor: 'pointer', fontSize: '13px', fontWeight: 600}}>重新开始</button>
            {!isLastStage && (
              <button onClick={nextStage} style={{backgroundColor: '#bc004b', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontFamily: 'Work Sans, sans-serif', cursor: 'pointer', fontSize: '13px', fontWeight: 600}}>下一关 ({stage + 2}/{totalStages}) →</button>
            )}
            {isLastStage && (
              <button onClick={() => { setShowQuiz(false); setShowSummary(false) }} style={{backgroundColor: '#bc004b', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontFamily: 'Work Sans, sans-serif', cursor: 'pointer', fontSize: '13px', fontWeight: 600}}>完成全部 🎉</button>
            )}
          </div>

          <div style={{textAlign: 'left'}}>
            <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '20px', marginBottom: '16px', color: '#bc004b'}}>本关详情</h3>
            {stageResults.map((r, i) => (
              <div key={i} style={{backgroundColor: r.correct ? '#e8f5e9' : '#fce8e8', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                  <span style={{fontSize: '20px'}}>{r.correct ? '✓' : '✗'}</span>
                  <div>
                    <p style={{fontFamily: 'Newsreader, serif', fontSize: '28px', fontWeight: 700, margin: '0 0 4px'}}>{r.question.word}</p>
                    <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', margin: 0}}>
                      正确：<span style={{color: toneColors[r.question.tone1], fontWeight: 700}}>第{toneNames[r.question.tone1]}声</span>
                      {' + '}
                      <span style={{color: toneColors[r.question.tone2], fontWeight: 700}}>第{toneNames[r.question.tone2]}声</span>
                      {!r.correct && r.chosenTone1 > 0 && (
                        <span style={{color: '#999'}}> · 你选了：第{toneNames[r.chosenTone1]}声+第{toneNames[r.chosenTone2]}声</span>
                      )}
                      {!r.correct && r.chosenTone1 === 0 && <span style={{color: '#999'}}> · 超时</span>}
                    </p>
                  </div>
                </div>
                {!r.correct && (
                  <button onClick={() => saveVocab(r.question.word, r.question.pinyin)} style={{backgroundColor: '#fff', border: '1px solid #bc004b', color: '#bc004b', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', fontFamily: 'Work Sans, sans-serif', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap'}}>+ 生词本</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  // QUIZ SCREEN
  if (showQuiz && stageQuestions[currentQ]) {
    const q = stageQuestions[currentQ]
    return (
      <main style={{maxWidth: '700px', margin: '0 auto', paddingBottom: '40px'}}>
        <header style={{position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px'}}>
          <button onClick={() => setShowQuiz(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '18px', color: '#bc004b', margin: 0}}>
            第{stage + 1}关 · {currentQ + 1}/{stageQuestions.length}
          </h1>
          <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#4d4447'}}>{stage + 1}/{totalStages}</span>
        </header>

        <div style={{padding: '72px 16px 16px'}}>
          <div style={{backgroundColor: '#fff0f4', borderRadius: '20px', padding: '32px 24px 24px', marginBottom: '16px', textAlign: 'center'}}>
            <p style={{fontFamily: 'Newsreader, serif', fontSize: '80px', fontWeight: 700, margin: '0 0 8px', color: '#25181e', lineHeight: 1}}>{q.word}</p>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '20px', margin: 0, letterSpacing: '0.05em',
              color: answered ? toneColors[q.tone1] : '#d0c3c7'
            }}>{q.pinyin}</p>
          </div>

          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px'}}>
            <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '32px', fontWeight: 700, color: timeLeft <= 3 ? '#e53935' : '#bc004b', minWidth: '40px', textAlign: 'center'}}>{timeLeft}</span>
            <div style={{flex: 1, height: '5px', backgroundColor: '#f4dce4', borderRadius: '3px', maxWidth: '160px'}}>
              <div style={{height: '100%', backgroundColor: timeLeft <= 3 ? '#e53935' : '#bc004b', borderRadius: '3px', width: (timeLeft / 10 * 100) + '%', transition: 'width 1s linear'}} />
            </div>
          </div>

          {/* Tone pair grid - 4x4 */}
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '6px'}}>
              <thead>
                <tr>
                  <th style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', color: '#4d4447', padding: '4px', width: '60px'}}></th>
                  {[1,2,3,4].map(t2 => (
                    <th key={t2} style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: toneColors[t2], padding: '4px', textAlign: 'center', fontWeight: 700}}>
                      {toneSymbols[t2]}<br/>第{toneNames[t2]}声
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4].map(t1 => (
                  <tr key={t1}>
                    <td style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: toneColors[t1], padding: '4px', fontWeight: 700, textAlign: 'center'}}>
                      {toneSymbols[t1]}<br/>第{toneNames[t1]}声
                    </td>
                    {[1,2,3,4].map(t2 => {
                      const isCorrect = t1 === q.tone1 && t2 === q.tone2
                      const isChosen = answered && answered.t1 === t1 && answered.t2 === t2
                      let bg = '#fff0f4'
                      let border = '1px solid transparent'
                      let color = '#25181e'
                      if (answered) {
                        if (isCorrect) { bg = toneColors[q.tone1]; color = '#fff'; border = '2px solid ' + toneColors[q.tone1] }
                        else if (isChosen) { bg = '#ffdad6'; color = '#93000a'; border = '2px solid #e53935' }
                      }
                      return (
                        <td key={t2} style={{padding: '3px'}}>
                          <button
                            onClick={() => handleAnswer(t1, t2)}
                            disabled={answered !== null}
                            style={{
                              width: '100%', padding: '10px 4px',
                              backgroundColor: bg, color, border, borderRadius: '8px',
                              fontFamily: 'Work Sans, sans-serif', fontSize: '11px',
                              fontWeight: 600, cursor: answered ? 'default' : 'pointer',
                              transition: 'all 0.15s', lineHeight: 1.3
                            }}
                          >
                            {t1}-{t2}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    )
  }

  // LYRICS SCREEN
  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <button onClick={() => router.push('/')} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>乐译</h1>
        </div>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <button onClick={startQuiz} style={{backgroundColor: '#bc004b', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: 'Work Sans, sans-serif', fontSize: '13px', cursor: 'pointer', fontWeight: 600}}>测验</button>
          <button onClick={() => router.push('/vocab')} style={{backgroundColor: '#fff0f4', color: '#bc004b', border: 'none', borderRadius: '8px', padding: '8px 12px', fontFamily: 'Work Sans, sans-serif', fontSize: '13px', cursor: 'pointer'}}>生词本</button>
          <button onClick={saveSong} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>bookmark_add</span>
          </button>
        </div>
      </header>

      <section style={{padding: '80px 24px 24px'}}>
        <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#b90c55', display: 'block', marginBottom: '8px'}}>正在播放</span>
        <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.1, marginBottom: '8px'}}>{song.title}</h2>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
          <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '18px', color: '#ab2c5d', margin: 0}}>{song.artist}</p>
          {searchResults.length > 1 && (
            <button onClick={() => setShowWrongLyrics(!showWrongLyrics)} style={{backgroundColor: 'transparent', color: '#7f7478', border: '1px solid #d0c3c7', borderRadius: '6px', padding: '4px 10px', fontFamily: 'Work Sans, sans-serif', fontSize: '11px', cursor: 'pointer'}}>歌词有误？</button>
          )}
        </div>

        {showWrongLyrics && (
          <div style={{backgroundColor: '#fff0f4', borderRadius: '12px', padding: '16px', marginBottom: '24px'}}>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em'}}>选择正确版本：</p>
            {loadingAlternate && <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: '#4d4447'}}>加载中...</p>}
            {searchResults.map(track => (
              <button key={track.id} onClick={() => loadAlternate(track)} style={{width: '100%', textAlign: 'left', backgroundColor: '#fff', border: '1px solid #f0d8d8', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', cursor: 'pointer'}}>
                <p style={{fontFamily: 'Newsreader, serif', fontSize: '16px', fontWeight: 700, margin: '0 0 4px'}}>{track.title}</p>
                <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', color: '#7f7478', margin: 0, textTransform: 'uppercase'}}>{track.artist}{track.album ? ' · ' + track.album : ''}</p>
              </button>
            ))}
          </div>
        )}

        <div style={{display: 'flex', gap: '8px', marginBottom: '32px'}}>
          {viewButtons.map(btn => (
            <button key={btn.mode} onClick={() => setViewMode(btn.mode)} style={{padding: '8px 20px', backgroundColor: viewMode === btn.mode ? '#bc004b' : '#fff0f4', color: viewMode === btn.mode ? '#fff' : '#bc004b', border: 'none', borderRadius: '8px', fontFamily: 'Work Sans, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer'}}>{btn.label}</button>
          ))}
        </div>
      </section>

      <section style={{padding: '0 24px'}}>
        {song.simplified.map((line, i) => {
          const colored = colorPinyinLine(song.pinyin[i] || '')
          return (
            <div key={i} style={{marginBottom: '32px'}}>
              <p style={{fontFamily: 'Newsreader, serif', fontSize: '22px', fontWeight: 700, color: '#25181e', marginBottom: '6px', lineHeight: 1.4}}>{line}</p>
              {viewMode !== 'hanzi' && (
                <p style={{marginBottom: '6px', lineHeight: 1.8}}>
                  {colored.map((syl, j) => (
                    <span key={j} style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: syl.color, marginRight: '6px'}}>{syl.text}</span>
                  ))}
                </p>
              )}
              {viewMode === 'full' && song.english[i] && !song.english[i].includes('QUERY') && !song.english[i].includes('LIMIT') && (
                <p style={{fontFamily: 'Newsreader, serif', fontSize: '12px', color: '#4d4447', fontStyle: 'italic', lineHeight: 1.5}}>{song.english[i]}</p>
              )}
            </div>
          )
        })}
      </section>
    </main>
  )
}
