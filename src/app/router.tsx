import { createBrowserRouter } from 'react-router-dom'
import Home from '@/pages/Home'
import Inbox from '@/pages/Inbox'
import Marketing from '@/pages/Marketing'
import Opportunities from '@/pages/Opportunities'
import Person from '@/pages/Person'
import Projects from '@/pages/Projects'
import Property from '@/pages/Property'
import { Placeholder } from '@/pages/Placeholder'
import { AppLayout } from './AppLayout'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/opportunities', element: <Opportunities /> },
      { path: '/projects', element: <Projects /> },
      { path: '/marketing', element: <Marketing /> },
      { path: '/inbox', element: <Inbox /> },
      { path: '/property/:id', element: <Property /> },
      { path: '/person/:id', element: <Person /> },
      { path: '*', element: <Placeholder title="Page not found" intro="That link doesn’t go anywhere yet." phase={1} /> },
    ],
  },
])
