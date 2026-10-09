/** "Good morning" / "Good afternoon" / "Good evening" for the hour (0–23). */
export function greetingWord(h: number) {
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
