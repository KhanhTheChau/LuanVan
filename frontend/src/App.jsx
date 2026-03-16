import React from 'react'
import AppRouter from './router/AppRouter'
import { AppContextProvider } from './context/AppContext'

function App() {
  return (
    <AppContextProvider>
      <AppRouter />
    </AppContextProvider>
  )
}

export default App
