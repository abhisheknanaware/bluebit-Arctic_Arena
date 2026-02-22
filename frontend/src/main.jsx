import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App.jsx'
import Home from './pages/Home.jsx';
import Guidelines from './pages/Guidelines.jsx';

const router = createBrowserRouter([
  {
     path: "/",
     element: <App />,          
     children: [
      { index: true, element: <Home /> },
      { path: "/guidelines", element: <Guidelines /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
