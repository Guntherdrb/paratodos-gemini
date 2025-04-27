import React from 'react';

// Recibe tienda_id directamente en las props
const ProductCard = ({ producto, slug }) => {

  const registrarLeadYComprar = () => {
    // Verifica si tenemos la información necesaria
    if (!producto || !producto.id || !producto.tienda_id) {
      console.error("Faltan datos para registrar el lead (producto.id o producto.tienda_id)");
      // Abrir WhatsApp igualmente aunque no se registre el lead
      abrirWhatsApp(); 
      return;
    }

    // 1. Registrar el lead (enviar al backend)
    fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        producto_id: producto.id, 
        tienda_id: producto.tienda_id 
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Lead registrado exitosamente:', data);
      } else {
        console.error('Error al registrar lead:', data.error);
      }
    })
    .catch(err => {
      console.error('Error de conexión al registrar lead:', err);
    })
    .finally(() => {
      // 2. Abrir WhatsApp (siempre se ejecuta, incluso si falla el registro del lead)
      abrirWhatsApp();
    });
  };

  const abrirWhatsApp = () => {
      // Construir el mensaje de WhatsApp
      const mensaje = encodeURIComponent(`Hola! Estoy interesado en el producto "${producto.nombre}" (${producto.precio}) que vi en tu tienda.`);
      // Obtener el teléfono de la tienda (necesitaría pasarse o estar en el objeto producto)
      // Por ahora, asumimos que está en producto.telefono si el endpoint lo devuelve
      const telefonoTienda = producto.telefono?.replace(/\D/g, ''); 
      let urlWhatsApp = `https://wa.me/`;
      if(telefonoTienda) {
          urlWhatsApp += `${telefonoTienda}?text=${mensaje}`;
      } else {
          // Fallback si no hay teléfono: abrir WhatsApp sin número específico
          // O podríamos buscar el teléfono de la tienda con una llamada adicional si fuera necesario
          console.warn("No se encontró teléfono para la tienda, abriendo WhatsApp sin número.")
          urlWhatsApp += `?text=${mensaje}`;
      }
      
      window.open(urlWhatsApp, '_blank');
  }

  return (
    <div className="bg-white shadow rounded-xl p-4 flex flex-col gap-2 hover:shadow-lg transition">
      {/* Imagen del producto (si existe) */}
      {producto.imagen && (
        <img src={producto.imagen} alt={producto.nombre} className="w-full h-40 object-cover rounded mb-2" />
      )}
      <h3 className="text-lg font-semibold">{producto.nombre}</h3>
      <p className="text-sm text-gray-600 flex-grow">{producto.descripcion || 'Sin descripción'}</p> {/* flex-grow para empujar botones abajo */}
      <p className="text-green-600 font-bold mt-auto">{producto.precio || 'Consultar precio'}</p> {/* mt-auto para empujar precio abajo */}

      <div className="flex gap-2 mt-2">
        {/* Botón llama a la nueva función */}
        <button onClick={registrarLeadYComprar} className="flex-1 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition">
          WhatsApp
        </button>
        <button
          className="text-sm px-3 py-1 border rounded text-gray-600 hover:text-blue-600 transition"
          onClick={() => navigator.share?.({ title: producto.nombre, url: window.location.href })}
        >
          Compartir
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
