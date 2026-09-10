import { Outlet } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import Header from '@/components/Header'
import { Toaster } from '@/components/ui/sonner'

export const Layout = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <Header />
        <main className="pb-20 md:pb-0">
          <Outlet />
        </main>
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  )
}
