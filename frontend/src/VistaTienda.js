import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCard from './src/ProductCard'; // Importa el componente de tarjeta de producto

function VistaTienda() {
  const { slug } = useParams();
  const [tienda, setTienda] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Promesas para obtener datos de la tienda y productos en paralelo
    Promise.all([
      fetch(`http://localhost:5000/api/tienda/${slug}`).then(res => {
        if (!res.ok) throw new Error('Tienda no encontrada o error del servidor.');
        return res.json();
      }),
      fetch(`http://localhost:5000/api/productos/${slug}`).then(res => {
        if (!res.ok) throw new Error('Error al cargar productos.');
        return res.json();
      })
    ])
    .then(([tiendaData, productosData]) => {
      if (tiendaData.success) {
        setTienda(tiendaData.tienda);
      } else {
        throw new Error(tiendaData.message || 'Error al cargar datos de la tienda.');
      }

      if (productosData.success && Array.isArray(productosData.productos)) {
        setProductos(productosData.productos);
      } else {
        console.warn('Productos no encontrados o formato de respuesta incorrecto', productosData);
        setProductos([]); // Establece vacío si no hay productos o hay error
      }
      
      setLoading(false);
    })
    .catch(err => {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Ocurrió un error al cargar la página.');
      setLoading(false);
    });

  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
        Cargando tienda...
        {/* Podrías añadir un spinner aquí */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700 p-4">
        <h2 className="text-2xl font-bold mb-4">¡Oops! Algo salió mal</h2>
        <p>{error}</p>
        {/* Podrías añadir un botón para reintentar o volver al inicio */}
      </div>
    );
  }
  
  // Si la tienda no se cargó pero no hubo error técnico (ej. slug no existe)
  if (!tienda) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-600 p-4">
        <h2 className="text-2xl font-bold mb-4">Tienda no encontrada</h2>
        <p>No pudimos encontrar la tienda que buscas.</p>
      </div>
    );
  }

  // Renderiza la tienda si todo está bien
  return (
    <div 
      className="min-h-screen pb-12 pt-8 px-4 sm:px-6 lg:px-8" 
      // Usa un color de fondo base, pero idealmente la tienda podría personalizarlo
      style={{ backgroundColor: tienda.color || '#f9fafb' }} // fallback a gris muy claro
    >
      <div className="max-w-6xl mx-auto">
        {/* Encabezado de la tienda */}
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-10 flex flex-col md:flex-row items-center gap-6">
          <img
            // Asegúrate que la ruta al logo es correcta
            src={`http://localhost:5000${tienda.logo_url}` || './placeholder-logo.png'} 
            alt={`Logo de ${tienda.nombre}`}
            className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-indigo-100 shadow-sm"
            onError={(e) => { e.target.onerror = null; e.target.src='./placeholder-logo.png'}} // Fallback si la imagen no carga
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{tienda.nombre}</h1>
            <p className="text-md text-gray-600 mt-1">{tienda.descripcion || 'Bienvenidos a nuestra tienda en ParaTodosIA.'}</p>
             {/* Aquí podrías añadir más datos como redes sociales si los tienes */}
          </div>
           <a
            href={`http://localhost:5000${tienda.catalogo_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto mt-4 md:mt-0 flex-shrink-0 inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            Ver Catálogo Original (PDF)
          </a>
        </div>

        {/* Sección de Productos */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Nuestros Productos</h2>
        {productos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((p) => (
              <ProductCard key={p.id || p.nombre} producto={p} slug={slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white shadow rounded-lg">
            <p className="text-xl text-gray-500">No hay productos para mostrar en este momento.</p>
            <p className="text-gray-500 mt-2">El dueño de la tienda puede cargarlos desde su catálogo PDF.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default VistaTienda;
