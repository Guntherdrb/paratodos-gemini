import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Componente simple para la tarjeta de una tienda en el marketplace
const TiendaCard = ({ tienda }) => (
  <Link 
    to={`/tienda/${tienda.slug}`} 
    className="block bg-white rounded-lg shadow-md overflow-hidden transition duration-300 ease-in-out hover:shadow-xl transform hover:-translate-y-1"
  >
    {/* Placeholder para el Logo */}
    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
      <img 
        src={`http://localhost:5000${tienda.logo_url}` || './placeholder-logo.png'} 
        alt={`Logo de ${tienda.nombre}`} 
        className="object-contain h-24 w-auto max-w-[80%]"
        onError={(e) => { e.target.onerror = null; e.target.src='./placeholder-logo.png'}} // Fallback
      />
    </div>
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 truncate" title={tienda.nombre}>
        {tienda.nombre || 'Nombre no disponible'}
      </h3>
      {/* Podríamos añadir descripción si la API la devuelve */}
      {/* <p className="text-sm text-gray-600 mt-1 truncate">{tienda.descripcion || 'Visita la tienda'}</p> */}
    </div>
  </Link>
);

function Marketplace() {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Llama a un endpoint que debería listar tiendas (ej. las últimas N tiendas)
    // **NOTA:** Este endpoint /api/tiendas/lista probablemente necesita ser creado en el backend
    fetch('http://localhost:5000/api/tiendas/lista') 
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar las tiendas');
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.tiendas)) {
          setTiendas(data.tiendas);
        } else {
          console.warn('Respuesta inesperada del API:', data);
          setError('No se pudieron cargar las tiendas.');
          setTiendas([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tiendas:', err);
        setError(err.message || 'Ocurrió un error al conectar con el servidor.');
        setLoading(false);
        setTiendas([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <img src="/logopartodosia.png" alt="ParaTodosIA Logo" className="mx-auto h-16 w-auto mb-4"/>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Bienvenido a ParaTodosIA
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Explora tiendas creadas a partir de catálogos PDF gracias a la Inteligencia Artificial.
          </p>
        </div>

        {loading && (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">Cargando tiendas disponibles...</p>
             {/* Spinner podría ir aquí */}
          </div>
        )}

        {!loading && error && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 max-w-3xl mx-auto" role="alert">
            <strong className="font-bold">¡Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading && !error && tiendas.length === 0 && (
          <div className="text-center py-10 bg-white shadow rounded-lg">
            <p className="text-xl text-gray-500">Aún no hay tiendas disponibles.</p>
            <p className="text-gray-500 mt-2">¡Sé el primero en crear la tuya!</p>
            <Link to="/crear-tienda" className="mt-4 inline-block px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition">
                Crear mi Tienda Ahora
            </Link>
          </div>
        )}

        {!loading && !error && tiendas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tiendas.map((tienda) => (
              <TiendaCard key={tienda.id || tienda.slug} tienda={tienda} />
            ))}
          </div>
        )}
        
        {/* Enlace fijo para crear tienda */}
        <div className="fixed bottom-6 right-6">
           <Link 
             to="/crear-tienda" 
             className="inline-flex items-center p-4 border border-transparent rounded-full shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition transform hover:scale-105"
             title="Crear nueva tienda"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
           </Link>
        </div>
      </div>
    </div>
  );
}

export default Marketplace;
