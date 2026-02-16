import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'sepia'
export type FontFamily = 'serif' | 'sans'

interface SettingsState {
  theme: Theme
  fontSize: number
  fontFamily: FontFamily
  lineHeight: number
  sidebarVisible: boolean

  // Actions
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
  setFontSize: (size: number) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  setFontFamily: (family: FontFamily) => void
  setLineHeight: (height: number) => void
  toggleSidebar: () => void
}

const themes: Theme[] = ['light', 'dark', 'sepia']

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      fontSize: 18,
      fontFamily: 'serif',
      lineHeight: 1.8,
      sidebarVisible: true,

      setTheme: (theme) => set({ theme }),

      cycleTheme: () => {
        const current = get().theme
        const currentIndex = themes.indexOf(current)
        const nextIndex = (currentIndex + 1) % themes.length
        set({ theme: themes[nextIndex] })
      },

      setFontSize: (fontSize) => set({ fontSize: Math.min(32, Math.max(12, fontSize)) }),

      increaseFontSize: () => {
        const { fontSize } = get()
        set({ fontSize: Math.min(32, fontSize + 2) })
      },

      decreaseFontSize: () => {
        const { fontSize } = get()
        set({ fontSize: Math.max(12, fontSize - 2) })
      },

      setFontFamily: (fontFamily) => set({ fontFamily }),

      setLineHeight: (lineHeight) => set({ lineHeight }),

      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
    }),
    {
      name: 'glyph-settings',
    }
  )
)
