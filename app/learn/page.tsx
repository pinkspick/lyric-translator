'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllDays, buildMarkdown, clearLog, type DayEntry } from '../../lib/learnLog'

type Day = { date: string; entry: DayEntry }

const LEVEL_BG: Record<number, string> = { 5: '#fff3e0', 6: '#fde8e8', 7: '#e3f2fd' }
const LEVEL_FG: Record<number, string> = { 5: '#e65100', 6: '#b71c1c', 7: '#0d47a1' }

export default function LearnPage() {
  const router = useRouter()
  const [days, setDays] = useState<Day[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => { setDays(getAllDays()) }, [])

  async function copyAll() {
    const md = buildMarkdown()
    try {
      await navigator.clipboard.writeText(md)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = md
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
      document.body.removeChild(ta)
    }
  }

  function reset() {
    if (confirm('清空全部学习记录？此操作不可撤销。')) {
      clearLog()
      setDays([])
    }
  }

  const totalNew = days.reduce((s, d) => s + d.entry.newWords.length, 0)
  const totalQuizzes = days.reduce((s, d) => s + d.entry.quizzes.length, 0)
  const avgScore = (() => {
    const all = days.flatMap(d => d.entry.quizzes.map(q => q.score))
    if (!all.length) return null
    return all.reduce((a, b) => a + b, 0) / all.length
  })()

  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <button onClick={() => router.back()} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>学习记录</h1>
        </div>
        <button onClick={copyAll} style={{
          backgroundColor: copied ? '#2e7d32' : '#bc004b', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
          fontFamily: 'Work Sans, sans-serif', fontSize: '12px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <span className="material-symbols-outlined" style={{fontSize: '18px'}}>{copied ? 'check' : 'content_copy'}</span>
          {copied ? '已复制' : '复制全部'}
        </button>
      </header>

      <section style={{padding: '96px 24px 24px'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px'}}>
          <Stat label="新生词" value={String(totalNew)} />
          <Stat label="测验次数" value={String(totalQuizzes)} />
          <Stat label="平均分" value={avgScore !== null ? avgScore.toFixed(1) : '—'} />
        </div>

        <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', color: '#7f7478', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px'}}>
          复制后可粘贴到 Google Docs · 最新日期在最前
        </p>
      </section>

      <section style={{padding: '0 24px'}}>
        {days.length === 0 ? (
          <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '16px', color: '#7f7478', textAlign: 'center', padding: '40px 0'}}>
            还没有数据。打开一首歌，或开始一次测验吧。
          </p>
        ) : days.map(({date, entry}) => (
          <div key={date} style={{marginBottom: '40px'}}>
            <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '28px', fontWeight: 700, color: '#25181e', margin: '0 0 4px'}}>{date}</h2>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', color: '#7f7478', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px'}}>
              {entry.newWords.length} 新词 · {entry.quizzes.length} 测验 · {entry.seenSongs.length} 首歌
            </p>

            {entry.newWords.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '16px', color: '#bc004b', margin: '0 0 10px'}}>新生词</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                  {entry.newWords.map(w => (
                    <div key={w.word} style={{backgroundColor: '#fff', border: '1px solid #f0d8d8', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start'}}>
                      <div style={{flex: 1, minWidth: 0}}>
                        <p style={{fontFamily: 'Newsreader, serif', fontSize: '20px', fontWeight: 700, color: '#25181e', margin: '0 0 2px'}}>{w.word}</p>
                        <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#bc004b', margin: '0 0 2px'}}>{w.pinyin}</p>
                        <p style={{fontFamily: 'Newsreader, serif', fontSize: '12px', color: '#4d4447', margin: 0, lineHeight: 1.4, overflowWrap: 'anywhere'}}>{w.meaning}</p>
                      </div>
                      <span style={{flexShrink: 0, fontFamily: 'Work Sans, sans-serif', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px', backgroundColor: LEVEL_BG[w.level] || '#eee', color: LEVEL_FG[w.level] || '#444'}}>
                        HSK {w.level === 7 ? '7-9' : w.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.quizzes.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '16px', color: '#bc004b', margin: '0 0 10px'}}>测验</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {entry.quizzes.map((q, qi) => (
                    <div key={qi} style={{backgroundColor: '#fff', border: '1px solid #f0d8d8', borderRadius: '10px', padding: '12px 14px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', gap: '12px'}}>
                        <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447', margin: 0, overflowWrap: 'anywhere'}}>
                          <span style={{color: '#7f7478'}}>{q.time}</span> · {q.source}
                        </p>
                        <p style={{fontFamily: 'Newsreader, serif', fontSize: '20px', fontWeight: 700, color: '#bc004b', margin: 0, whiteSpace: 'nowrap'}}>
                          {q.score.toFixed(2)} <span style={{fontSize: '12px', color: '#7f7478'}}>/ 100</span>
                        </p>
                      </div>
                      <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', color: '#7f7478', margin: '0 0 6px'}}>
                        {q.correct} / {q.total} 正确 · {q.wrongs.length} 错误
                      </p>
                      {q.wrongs.length > 0 && (
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px'}}>
                          {q.wrongs.map((w, wi) => (
                            <span key={wi} style={{backgroundColor: '#fce8e8', color: '#b71c1c', borderRadius: '6px', padding: '3px 8px', fontFamily: 'Work Sans, sans-serif', fontSize: '12px'}}>
                              {w.word} <span style={{opacity: 0.7, fontSize: '10px'}}>{w.pinyin}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.seenSongs.length > 0 && (
              <div>
                <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '16px', color: '#bc004b', margin: '0 0 10px'}}>听过的歌曲</h3>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                  {entry.seenSongs.map((s, si) => (
                    <span key={si} style={{backgroundColor: '#fff0f4', color: '#bc004b', borderRadius: '6px', padding: '4px 10px', fontFamily: 'Work Sans, sans-serif', fontSize: '12px'}}>
                      {s.title} <span style={{opacity: 0.6, fontSize: '10px'}}>· {s.artist}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {days.length > 0 && (
          <button onClick={reset} style={{
            background: 'none', border: '1px solid #d0c3c7', color: '#7f7478',
            borderRadius: '8px', padding: '10px 16px', cursor: 'pointer',
            fontFamily: 'Work Sans, sans-serif', fontSize: '12px',
            margin: '40px auto 0', display: 'block'
          }}>清空记录</button>
        )}
      </section>
    </main>
  )
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div style={{backgroundColor: '#fff0f4', borderRadius: '12px', padding: '14px', textAlign: 'center'}}>
      <p style={{fontFamily: 'Newsreader, serif', fontSize: '24px', fontWeight: 700, color: '#bc004b', margin: '0 0 2px'}}>{value}</p>
      <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '10px', color: '#4d4447', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0}}>{label}</p>
    </div>
  )
}
