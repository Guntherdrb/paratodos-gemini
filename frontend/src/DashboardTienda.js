import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function DashboardTienda() {
  const { slug } = useParams();
  const [datos, setDatos] = useState(null);
  const [leadCount, setLeadCount] = useState(0); // Estado para la cantidad de leads
  const [productCount, setProductCount] = useState(0); // Estado para la cantidad de productos

  // Cargar datos de la tienda
  useEffect(() => {
    fetch(`/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDatos(data.tienda);
        } else {
          console.error('Tienda no encontrada');
          // Podrías redirigir o mostrar un mensaje más claro
        }
      })
      .catch(err => {
        console.error('Error al cargar la tienda:', err);
      });
  }, [slug]);

  // Cargar cantidad de leads
  useEffect(() => {
    fetch(`/api/leads/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeadCount(data.count);
        } else {
          console.error('Error al cargar leads:', data.error);
        }
      })
      .catch(err => {
        console.error('Error de conexión al cargar leads:', err);
      });
  }, [slug]);

  // Cargar cantidad de productos (ya que lo tenemos en otra vista, lo añadimos aquí)
  useEffect(() => {
    fetch(`/api/productos/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductCount(data.productos.length); // Contamos los productos recibidos
        } else {
          console.error('Error al cargar productos para contador:', data.error);
        }
      })
      .catch(err => {
        console.error('Error de conexión al cargar productos:', err);
      });
  }, [slug]);

  if (!datos) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
        Cargando datos del dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard: {datos.nombre}
          </h1>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            Ir al inicio
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Mostrar contador de leads */}
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <p className="text-gray-700 font-medium">Pedidos (leads)</p>
            <p className="text-3xl font-bold text-blue-700">{leadCount}</p>
          </div>
          {/* Mostrar contador de productos */}
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <p className="text-gray-700 font-medium">Productos</p>
            <p className="text-3xl font-bold text-green-700">{productCount}</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            to={`/dashboard/${slug}/productos`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md transition duration-300"
          >
            Gestionar mis productos
          </Link>
          {/* Podríamos añadir un botón para ver los leads si desarrollamos esa vista */}
          {/* 
          <Link
            to={`/dashboard/${slug}/leads`}
            className="ml-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full shadow-md transition duration-300"
          >
            Ver mis leads
          </Link>
          */}
        </div>
      </div>
    </div>
  );
}

export default DashboardTienda;
