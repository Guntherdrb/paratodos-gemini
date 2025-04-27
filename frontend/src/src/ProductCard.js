import React from 'react';
import { ShareIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'; // Necesitarás instalar @heroicons/react

const ProductCard = ({ producto, slug }) => {
  // Idealmente, aquí tendrías la URL de la imagen del producto.
  // Por ahora, usaremos un placeholder.
  const imageUrl = producto.imagenUrl || null; // Asume que podrías tener una URL en el futuro

  const handleComprar = () => {
    // Asegúrate que el slug y nombre se codifican correctamente para la URL
    const tiendaNombre = slug.replace(/-/g, ' '); // Intenta obtener un nombre legible del slug
    const mensaje = encodeURIComponent(`¡Hola ${tiendaNombre}! Estoy interesado en el producto: ${producto.nombre}. ¿Podrías darme más información?`);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  const handleCompartir = async () => {
    const compartirData = {
      title: producto.nombre,
      text: `Mira este producto: ${producto.nombre} en la tienda ${slug} de ParaTodosIA!`,
      url: window.location.href, // O idealmente, una URL directa al producto si existiera
    };
    try {
      if (navigator.share) {
        await navigator.share(compartirData);
      } else {
        // Fallback por si Web Share API no está disponible (copiar al portapapeles?)
        console.log('Web Share API no soportada');
        alert('Puedes copiar la URL de la página para compartir.');
      }
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition duration-300 ease-in-out hover:shadow-xl flex flex-col">
      {/* Placeholder para la Imagen del Producto */}
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={producto.nombre} className="object-cover w-full h-full" />
        ) : (
          <span className="text-gray-500 text-sm">Imagen no disponible</span>
        )}
      </div>

      {/* Contenido de Texto */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate" title={producto.nombre}>
          {producto.nombre || 'Nombre no disponible'}
        </h3>
        <p className="text-sm text-gray-600 mb-3 flex-grow">
          {producto.descripcion || 'Descripción no disponible.'}
        </p>
        <p className="text-xl font-bold text-indigo-600 mb-4">
          {producto.precio || 'Precio no disponible'} 
        </p>
        
        {/* Botones de Acción */}
        <div className="mt-auto flex space-x-2">
          <button 
            onClick={handleComprar} 
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.93 8.93 0 01-2.646-.416l-1.932.966a.5.5 0 01-.65-.65l.966-1.932A8.93 8.93 0 012 10c0-4.418 3.582-8 8-8s8 3.582 8 8zm-5.087-.71a.5.5 0 01.707 0l1.713 1.714a.5.5 0 01-.707.707L13 10.707l-1.713 1.713a.5.5 0 01-.707-.707l1.713-1.713-1.713-1.714a.5.5 0 010-.707zM9 8a1 1 0 11-2 0 1 1 0 012 0zm-3 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Contactar
          </button>
          <button 
            onClick={handleCompartir} 
            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            title="Compartir producto"
          >
            <ShareIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
