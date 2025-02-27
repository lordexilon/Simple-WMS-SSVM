import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Warehouse, BoxSelect as BoxSeam, BarChart3, LogOut, Grid } from 'lucide-react';
import { supabase } from './lib/supabase';
import Products from './components/Products';
import Movements from './components/Movements';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Posiciones from './components/Posiciones';
import Depositos from './components/Depositos';


function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth onSignIn={() => {}} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Warehouse className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">WMS Basic</span>
                </div>
                <div className="ml-6 flex space-x-8">
                  <Link to="/" className="flex items-center px-4 text-gray-600 hover:text-gray-900">
                    <BarChart3 className="h-6 w-6" />
                    <span className="ml-2">Dashboard</span>
                  </Link>
                  <Link to="/products" className="flex items-center px-4 text-gray-600 hover:text-gray-900">
                    <BoxSeam className="h-6 w-6" />
                    <span className="ml-2">Productos</span>
                  </Link>
                  <Link to="/movements" className="flex items-center px-4 text-gray-600 hover:text-gray-900">
                    <Warehouse className="h-6 w-6" />
                    <span className="ml-2">Movimientos</span>
                  </Link>
                  <Link to="/depositos" className="flex items-center px-4 text-gray-600 hover:text-gray-900">
                    <Grid className="h-6 w-6" />
                    <span className="ml-2">Depositos</span>
                  </Link>
                  <Link to="/posiciones" className="flex items-center px-4 text-gray-600 hover:text-gray-900">
                    <Grid className="h-6 w-6" />
                    <span className="ml-2">Posiciones</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-4">
                  {session.user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/posiciones" element={<Posiciones />} />
            <Route path="/depositos" element={<Depositos />} />

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
