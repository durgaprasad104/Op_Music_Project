import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { PlayerProvider } from './context/PlayerContext'
import { useThemeStore } from './store/store'
import MainLayout from './components/Layout/MainLayout'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Playlists from './pages/Playlists'
import Settings from './pages/Settings'
import SongDetailOverlay from './components/UI/SongDetailOverlay'
import OnboardingModal from './components/UI/OnboardingModal'

export default function App() {
  const initTheme = useThemeStore(s => s.initTheme)

  useEffect(() => {
    initTheme()
  }, [])

  return (
    <BrowserRouter>
      <PlayerProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="library" element={<Library />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <SongDetailOverlay />
        <OnboardingModal />
      </PlayerProvider>
    </BrowserRouter>
  )
}
