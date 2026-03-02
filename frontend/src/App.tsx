import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { theme as customTheme } from './styles/theme'
import { AntdGlobalHelper } from './utils/antdGlobal'
import './App.css'

const AppContent = () => {
  const { mode } = useTheme()

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: customTheme.colors.primary.main,
          colorBgContainer: mode === 'dark' ? '#1f2937' : '#ffffff',
          colorBgLayout: mode === 'dark' ? '#111827' : '#f3f4f6',
        },
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AntdApp>
            <AntdGlobalHelper />
            <AppRoutes />
          </AntdApp>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App

