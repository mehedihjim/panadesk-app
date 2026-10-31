export const DIGIT_ORDER = ['1','2','3','4','5','6','7','8','9','0'] as const

const rank = (digit: string) => DIGIT_ORDER.indexOf(digit as (typeof DIGIT_ORDER)[number])

export function isValidPana(str: string) {
  return /^\d{3}$/.test(str) && [...str].every((digit, index, digits) => index === 0 || rank(digit) >= rank(digits[index - 1]))
}

export function getPanaType(str: string): 'SP' | 'DP' | 'TP' {
  const unique = new Set(str).size
  return unique === 3 ? 'SP' : unique === 2 ? 'DP' : 'TP'
}

export function getAllPanas() {
  const panas: string[] = []
  for (const a of DIGIT_ORDER) for (const b of DIGIT_ORDER) for (const c of DIGIT_ORDER) {
    const value = `${a}${b}${c}`
    if (isValidPana(value)) panas.push(value)
  }
  return panas
}
