import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from './src/ProductCard'; // Importa el nuevo componente

function ProductosTienda() {
  const { slug } = useParams();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:5000/api/productos/${slug}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar los productos desde el servidor.');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.productos)) {
          setProductos(data.productos);
        } else {
          console.warn('La respuesta del API no tiene el formato esperado o no fue exitosa:', data);
          setError('No se pudieron cargar los productos o no hay productos disponibles.');
          setProductos([]); // Asegura que productos sea un array vacío si falla
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching productos:', error);
        setError(error.message || 'Ocurrió un error al conectar con el servidor.');
        setLoading(false);
        setProductos([]); // Asegura estado vacío en caso de error de red
      });
  }, [slug]);

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Mis Productos</h1>
          {/* TODO: Funcionalidad Agregar Producto - Puede requerir un modal o nueva página */}
          <Link
            to={`/dashboard/${slug}/productos/nuevo`}
            className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            ➕ Agregar Nuevo Producto
          </Link>
        </div>

        {loading && (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">Cargando productos...</p>
            {/* Puedes añadir un spinner aquí */}
          </div>
        )}
        
        {!loading && error && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 max-w-3xl mx-auto" role="alert">
            <strong className="font-bold">¡Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading && !error && productos.length === 0 && (
          <div className="text-center py-10 bg-white shadow rounded-lg">
            <p className="text-xl text-gray-500">Aún no tienes productos cargados.</p>
            <p className="text-gray-500 mt-2">Sube un nuevo catálogo o agrega productos manualmente.</p>
          </div>
        )}

        {!loading && !error && productos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((p) => (
              // Usa el ProductCard, pasando el producto y el slug
              <ProductCard key={p.id || p.nombre} producto={p} slug={slug} /> 
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductosTienda;
