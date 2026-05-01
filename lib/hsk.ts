import raw from './hskWords.json'

type HskLevel = '4' | '5' | '6' | '7'
type Entry = [string, string]

const data = raw as Record<HskLevel, Entry[]>

const wordToLevel = new Map<string, number>()
for (const lvl of ['4', '5', '6', '7'] as HskLevel[]) {
  const num = lvl === '7' ? 7 : Number(lvl)
  for (const [word] of data[lvl]) {
    if (!wordToLevel.has(word)) wordToLevel.set(word, num)
  }
}

export function getHskLevel(word: string): number | null {
  return wordToLevel.get(word) ?? null
}

export function isAdvancedHsk(word: string): boolean {
  const lvl = wordToLevel.get(word)
  return lvl !== undefined && lvl >= 4
}

export type HskWord = { word: string; pinyin: string; level: number }

export function getRandomAdvancedWords(count: number): HskWord[] {
  const pool: HskWord[] = []
  for (const lvl of ['4', '5', '6', '7'] as HskLevel[]) {
    const num = lvl === '7' ? 7 : Number(lvl)
    for (const [word, pinyin] of data[lvl]) {
      pool.push({ word, pinyin, level: num })
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
