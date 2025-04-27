import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import Marketplace from './Marketplace'; // Importa el nuevo componente
import FormularioTienda from './FormularioTienda';
import VistaTienda from './VistaTienda';
import DashboardTienda from './DashboardTienda';
import ProductosTienda from './ProductosTienda';
import AgregarProducto from './AgregarProducto';
import ConfirmacionTienda from './ConfirmacionTienda'; // Asegúrate que este componente existe y está estilizado
import Navbar from './components/Navbar';

function Layout() {
  const location = useLocation();
  // Rutas donde NO queremos mostrar el Navbar principal (ej. vista pública de tienda)
  const ocultarNavbar = location.pathname.startsWith('/tienda/');
  const esMarketplace = location.pathname === '/';

  return (
    <>
      {/* Solo muestra Navbar si no está en las rutas a ocultar Y NO es el marketplace (que tiene su propio header)*/}
      {/*!ocultarNavbar && !esMarketplace && <Navbar />*/}
      {/* O quizás siempre mostrar Navbar excepto en vista tienda? Decide tu diseño */}
      {!ocultarNavbar && <Navbar />} 
      
      {/* Añade padding top solo si el Navbar está visible para evitar solapamiento */}
      <div className={!ocultarNavbar ? 'pt-16' : ''}> {/* Ajusta pt-16 según altura real del Navbar */}
        <Routes>
          <Route path="/" element={<Marketplace />} /> {/* Ruta principal para el Marketplace */}
          <Route path="/crear-tienda" element={<FormularioTienda />} /> {/* Ruta específica para crear tienda */}
          <Route path="/tienda/:slug" element={<VistaTienda />} />
          <Route path="/tienda-creada/:slug" element={<ConfirmacionTienda />} /> {/* Ruta para la confirmación */}
          <Route path="/dashboard/:slug" element={<DashboardTienda />} />
          <Route path="/dashboard/:slug/productos" element={<ProductosTienda />} />
          {/* Considera si la ruta /nuevo debe ser modal o página completa */}
          <Route path="/dashboard/:slug/productos/nuevo" element={<AgregarProducto />} /> 
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
