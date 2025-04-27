import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function VerProducto() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);

  useEffect(() => {
    fetch(`/api/producto/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducto(data.producto);
        } else {
          alert('Producto no encontrado');
          // Considerar redirigir o mostrar un mensaje más elegante
        }
      })
      .catch(err => {
        console.error("Error cargando producto:", err);
        alert('Error de conexión al cargar el producto.');
      });
  }, [id]);

  const registrarLead = () => {
    // Verifica si tenemos la información necesaria
    if (!producto || !producto.id || !producto.tienda || !producto.tienda.id) {
      console.error("Faltan datos para registrar el lead (producto.id o producto.tienda.id)");
      return; // No intentar registrar si faltan datos
    }

    // Enviar petición para crear el lead
    fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        producto_id: producto.id, 
        tienda_id: producto.tienda.id 
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Lead registrado desde VerProducto:', data);
      } else {
        console.error('Error al registrar lead desde VerProducto:', data.error);
      }
    })
    .catch(err => {
      console.error('Error de conexión al registrar lead desde VerProducto:', err);
    });
  };

  const handleWhatsAppClick = () => {
    // 1. Intentar registrar el lead
    registrarLead();

    // 2. Abrir WhatsApp
    const telefonoTienda = producto?.tienda?.telefono?.replace(/\D/g, '');
    if (telefonoTienda) {
      const mensaje = encodeURIComponent(`Hola! Estoy interesado en el producto "${producto.nombre}" (${producto.precio}) que vi en tu tienda (${producto.tienda.nombre}).`);
      const urlWhatsApp = `https://wa.me/${telefonoTienda}?text=${mensaje}`;
      window.open(urlWhatsApp, '_blank');
    } else {
      alert("El número de WhatsApp de esta tienda no está disponible.");
    }
  };

  const handleShare = async () => {
    // ... (código de compartir existente)
    try {
      if (navigator.share) {
        await navigator.share({
          title: producto.nombre,
          text: producto.descripcion,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error al compartir', err);
    }
  };

  if (!producto) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <span className="text-gray-500 text-lg">Cargando producto...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Enlace a la tienda */}
        {producto.tienda && (
          <Link
            to={`/tienda/${producto.tienda.slug}`}
            className="text-sm text-blue-600 hover:underline uppercase tracking-wide mb-4 block"
          >
            {producto.tienda.nombre}
          </Link>
        )}

        <div className="flex flex-col lg:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Imagen del producto */}
          {producto.imagen && (
            <div className="lg:w-1/2">
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Detalles del producto */}
          <div className="lg:w-1/2 p-6 flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 uppercase tracking-tight">
              {producto.nombre}
            </h1>
            <p className="text-2xl text-gray-800 font-semibold mb-6">{producto.precio || 'Precio no disponible'}</p>
            <p className="text-gray-700 mb-6 flex-1">{producto.descripcion || 'Sin descripción'}</p>

            <div className="flex items-center space-x-4 mb-6">
              {/* Botón Compartir */}
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                title="Compartir producto"
              >
                🔗
                <span className="ml-2">Compartir</span>
              </button>

              {/* Instagram de la tienda (sigue siendo un enlace directo) */}
              {producto.tienda?.instagram && (
                <a
                  href={`https://instagram.com/${producto.tienda.instagram.replace('@','')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition"
                  title="Instagram de la tienda"
                >
                 {/* Icono SVG de Instagram */}
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.25-.88a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76z" /></svg>
                </a>
              )}

              {/* WhatsApp de la tienda (ahora es un botón) */}
              {producto.tienda?.telefono && (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                  title="WhatsApp de la tienda"
                >
                  💬
                  <span className="ml-2">WhatsApp</span>
                </button>
              )}
            </div>

            {/* Botón Comprar ahora (ahora es un botón) */}
            {producto.tienda?.telefono && (
               <button
                 onClick={handleWhatsAppClick}
                 className="inline-block bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition self-start"
               >
                 Comprar ahora
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerProducto;
