import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App

