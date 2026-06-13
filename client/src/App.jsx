import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router.js'

const router = getRouter()

function App() {
  return <RouterProvider router={router} />
}

export default App
