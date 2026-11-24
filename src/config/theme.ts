export const theme = {
  cream: '#FFF9F0',
  gold: '#F4D99D',
  pink: '#F2D2D5',
  green: '#DCE6D4',
  blue: '#DCE7F1',
  lilac: '#E5D9ED',
  white: '#FFFFFF',
  ink: '#403A34',
} as const

export type Accent = keyof typeof theme
