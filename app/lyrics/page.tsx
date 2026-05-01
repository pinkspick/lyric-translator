'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { colorPinyinLine } from '../../lib/toneColors'
import { isAdvancedHsk, getHskWord, type HskWord } from '../../lib/hsk'
import QuizRunner, { QuizQuestion } from '../components/QuizRunner'
import DictionaryDrawer from '../components/DictionaryDrawer'

type LyricResult = {
  title: string
  artist: string
  simplified: string[]
  pinyin: string[]
  english: string[]
}

type ViewMode = 'pinyin' | 'full' | 'hanzi'

type SearchResult = {
  id: number
  title: string
  artist: string
  album: string
  hasLyrics: boolean
}

const toneMarkMap: Record<string, string> = {
  'ā':'a','á':'a','ǎ':'a','à':'a',
  'ē':'e','é':'e','ě':'e','è':'e',
  'ī':'i','í':'i','ǐ':'i','ì':'i',
  'ō':'o','ó':'o','ǒ':'o','ò':'o',
  'ū':'u','ú':'u','ǔ':'u','ù':'u',
  'ǖ':'ü','ǘ':'ü','ǚ':'ü','ǜ':'ü',
}

const toneMarkDetect: Record<string, number> = {
  'ā':1,'ē':1,'ī':1,'ō':1,'ū':1,'ǖ':1,
  'á':2,'é':2,'í':2,'ó':2,'ú':2,'ǘ':2,
  'ǎ':3,'ě':3,'ǐ':3,'ǒ':3,'ǔ':3,'ǚ':3,
  'à':4,'è':4,'ì':4,'ò':4,'ù':4,'ǜ':4,
}

function stripTone(syl: string): string {
  return syl.split('').map((c: string) => toneMarkMap[c] || c).join('')
}

function getSyllableTone(syl: string): number {
  for (const ch of syl) { if (toneMarkDetect[ch]) return toneMarkDetect[ch] }
  return 0
}

function extractQuizWords(song: LyricResult): QuizQuestion[] {
  const qs: QuizQuestion[] = []
  const seen = new Set<string>()
  for (let i = 0; i < song.simplified.length; i++) {
    const chars = song.simplified[i]
    const syllables = song.pinyin[i]?.split(' ') || []
    const english = song.english[i] || ''
    const chineseChars = chars.split('').filter(c => /[一-鿿]/.test(c))
    if (chineseChars.length !== syllables.length) continue
    for (let j = 0; j < syllables.length - 1; j++) {
      const word = chineseChars[j] + chineseChars[j + 1]
      if (seen.has(word)) continue
      const t1 = getSyllableTone(syllables[j])
      const t2 = getSyllableTone(syllables[j + 1])
      if (t1 === 0 || t2 === 0) continue
      if (!isAdvancedHsk(word)) continue
      seen.add(word)
      qs.push({
        word,
        syl1Base: stripTone(syllables[j]),
        syl2Base: stripTone(syllables[j + 1]),
        tone1: t1,
        tone2: t2,
        pinyin: syllables[j] + ' ' + syllables[j + 1],
        english
      })
    }
  }
  return qs.sort(() => Math.random() - 0.5)
}

export default function LyricsPage() {
  const [song, setSong] = useState<LyricResult | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('hanzi')
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showWrongLyrics, setShowWrongLyrics] = useState(false)
  const [loadingAlternate, setLoadingAlternate] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [dictWord, setDictWord] = useState<string | null>(null)
  const [dictPinyin, setDictPinyin] = useState<string>('')
  const router = useRouter()

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
    function onScroll() { setScrolled(window.scrollY > 400) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!autoScroll) return
    let raf = 0
    let last = performance.now()
    function tick(now: number) {
      const dt = now - last
      last = now
      window.scrollBy(0, scrollSpeed * 50 * dt / 1000)
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2
      if (atBottom) { setAutoScroll(false); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, scrollSpeed])

  function startQuiz() {
    if (!song) return
    const qs = extractQuizWords(song)
    if (qs.length === 0) {
      alert('这首歌没有 HSK 4 以上的双字词')
      return
    }
    setQuizQuestions(qs)
    setShowQuiz(true)
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

  function openDict(word: string, pinyinForWord: string) {
    setDictWord(word)
    setDictPinyin(pinyinForWord)
  }

  const advancedWords = useMemo<HskWord[]>(() => {
    if (!song) return []
    const seen = new Set<string>()
    const out: HskWord[] = []
    for (const line of song.simplified) {
      const chars = line.split('').filter(c => /[一-鿿]/.test(c))
      for (let j = 0; j < chars.length - 1; j++) {
        const word = chars[j] + chars[j + 1]
        if (seen.has(word)) continue
        const hsk = getHskWord(word)
        if (hsk && hsk.level >= 5) {
          seen.add(word)
          out.push(hsk)
        }
      }
    }
    return out.sort((a, b) => a.level - b.level)
  }, [song])

  const viewButtons: { mode: ViewMode; label: string }[] = [
    { mode: 'hanzi', label: '汉字' },
    { mode: 'pinyin', label: '拼音' },
    { mode: 'full', label: '全文' },
  ]

  if (!song) return (
    <main style={{paddingTop: '120px', textAlign: 'center'}}>
      <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#4d4447'}}>未加载歌曲</p>
      <button onClick={() => router.push('/')} style={{marginTop: '16px', backgroundColor: '#bc004b', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Work Sans, sans-serif', cursor: 'pointer'}}>搜索歌曲</button>
    </main>
  )

  if (showQuiz) {
    return <QuizRunner
      questions={quizQuestions}
      title={'第1关'}
      onExit={() => setShowQuiz(false)}
      onRestart={startQuiz}
    />
  }

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
        <div style={{display: 'flex', gap: '8px', marginBottom: '32px', justifyContent: 'flex-end'}}>
          {viewButtons.map(btn => (
            <button key={btn.mode} onClick={() => setViewMode(btn.mode)} style={{padding: '8px 20px', backgroundColor: viewMode === btn.mode ? '#bc004b' : '#fff0f4', color: viewMode === btn.mode ? '#fff' : '#bc004b', border: 'none', borderRadius: '8px', fontFamily: 'Work Sans, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer'}}>{btn.label}</button>
          ))}
        </div>
      </section>

      <section style={{padding: '0 24px'}}>
        {song.simplified.map((line, i) => {
          const colored = colorPinyinLine(song.pinyin[i] || '')
          const syllables = (song.pinyin[i] || '').split(' ')
          const chineseChars = line.split('').filter(c => /[一-鿿]/.test(c))
          const aligned = chineseChars.length === syllables.length
          let charIdx = 0
          return (
            <div key={i} style={{marginBottom: '32px'}}>
              <p style={{fontFamily: 'Newsreader, serif', fontSize: '22px', fontWeight: 700, color: '#25181e', marginBottom: '6px', lineHeight: 1.4, overflowWrap: 'anywhere'}}>
                {line.split('').map((ch, ci) => {
                  const isChinese = /[一-鿿]/.test(ch)
                  if (!isChinese) return <span key={ci}>{ch}</span>
                  const myIdx = charIdx
                  charIdx++
                  const syl = aligned ? syllables[myIdx] : ''
                  return (
                    <span
                      key={ci}
                      onClick={() => openDict(ch, syl)}
                      style={{cursor: 'pointer'}}
                    >{ch}</span>
                  )
                })}
              </p>
              {viewMode !== 'hanzi' && (
                <p style={{marginBottom: '6px', lineHeight: 1.8, display: 'flex', flexWrap: 'wrap', gap: '0 6px'}}>
                  {colored.map((syl, j) => (
                    <span key={j} style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: syl.color}}>{syl.text}</span>
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

      {advancedWords.length > 0 && (
        <section style={{padding: '40px 24px 0'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px'}}>
            <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '24px', color: '#bc004b', margin: 0}}>本曲生词</h3>
            <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7f7478'}}>HSK 5+ · {advancedWords.length} 个</span>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {advancedWords.map(w => (
              <button
                key={w.word}
                onClick={() => openDict(w.word, w.pinyin)}
                style={{textAlign: 'left', backgroundColor: '#fff', border: '1px solid #f0d8d8', borderRadius: '12px', padding: '12px 16px', cursor: 'pointer', display: 'block'}}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px'}}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <p style={{fontFamily: 'Newsreader, serif', fontSize: '22px', fontWeight: 700, color: '#25181e', margin: '0 0 2px'}}>{w.word}</p>
                    <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#bc004b', margin: 0}}>{w.pinyin}</p>
                  </div>
                  <span style={{flexShrink: 0, fontFamily: 'Work Sans, sans-serif', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px', backgroundColor: w.level === 5 ? '#fff3e0' : w.level === 6 ? '#fde8e8' : '#e3f2fd', color: w.level === 5 ? '#e65100' : w.level === 6 ? '#b71c1c' : '#0d47a1'}}>HSK {w.level === 7 ? '7-9' : w.level}</span>
                </div>
                <p style={{fontFamily: 'Newsreader, serif', fontSize: '13px', color: '#4d4447', margin: '4px 0 0', lineHeight: 1.5, overflowWrap: 'anywhere'}}>{w.meaning}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div style={{position: 'fixed', right: '16px', bottom: '110px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', zIndex: 40}}>
        {autoScroll && (
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', borderRadius: '999px', padding: '6px 12px', boxShadow: '0 4px 12px rgba(188,0,75,0.15)'}}>
            <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', color: '#bc004b', fontWeight: 600}}>{scrollSpeed}×</span>
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.25}
              value={scrollSpeed}
              onChange={e => setScrollSpeed(Number(e.target.value))}
              style={{width: '110px', accentColor: '#bc004b'}}
            />
          </div>
        )}
        <button
          onClick={() => setAutoScroll(s => !s)}
          aria-label={autoScroll ? '暂停自动滚动' : '开始自动滚动'}
          style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: autoScroll ? '#bc004b' : '#fff',
            color: autoScroll ? '#fff' : '#bc004b',
            border: '1px solid #f4dce4', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(188,0,75,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
          <span className="material-symbols-outlined" style={{fontSize: '24px'}}>{autoScroll ? 'pause' : 'play_arrow'}</span>
        </button>
        {scrolled && (
          <button
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            aria-label="返回顶部"
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: '#fff', color: '#bc004b',
              border: '1px solid #f4dce4', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(188,0,75,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            <span className="material-symbols-outlined" style={{fontSize: '24px'}}>arrow_upward</span>
          </button>
        )}
      </div>

      <DictionaryDrawer word={dictWord} pinyin={dictPinyin} onClose={() => setDictWord(null)} />
    </main>
  )
}
