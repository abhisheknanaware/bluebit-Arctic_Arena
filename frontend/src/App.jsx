import { useState } from 'react'
import Footer from './components/Footer'
import { Outlet } from "react-router-dom";
import Navbar from './components/Navbar';

function App() {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        {/* Main content grows and pushes footer down */}
        <main className="flex-1 pt-1 bg-gray-50">
          <Outlet/>
        </main>

        <Footer/>
      </div>
    </>
  )
}

export default App
