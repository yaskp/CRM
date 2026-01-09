import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/Dashboard'
import Layout from '../components/layout/Layout'
import ProjectList from '../pages/projects/ProjectList'
import ProjectCreate from '../pages/projects/ProjectCreate'
import ProjectDetails from '../pages/projects/ProjectDetails'

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route
        path="/*"
        element={user ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectCreate />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes

