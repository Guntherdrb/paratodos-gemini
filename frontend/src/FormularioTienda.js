import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FormularioTienda() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Limpiar errores previos

    const formData = new FormData(event.target);
    const nombreTienda = formData.get('nombre');

    // Validación simple de nombre de tienda (puedes añadir más validaciones)
    if (!nombreTienda || nombreTienda.trim().length < 3) {
        setError('El nombre de la tienda debe tener al menos 3 caracteres.');
        return;
    }
     if (!formData.get('logo') || formData.get('logo').size === 0) {
        setError('Debes seleccionar un logo para la tienda.');
        return;
    }
    if (!formData.get('catalogo') || formData.get('catalogo').size === 0) {
        setError('Debes seleccionar un catálogo en PDF.');
        return;
    }


    try {
      // Asegúrate que la URL del backend es correcta, considera usar variables de entorno
      const response = await fetch('http://localhost:5000/api/tiendas', { 
        method: 'POST',
        body: formData, // FormData maneja automáticamente el multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('Tienda creada:', data);
      // Redirigir al dashboard o página de confirmación con el ID o slug
      navigate(`/tienda-creada/${data.tienda_slug || data.id}`); 

    } catch (error) {
      console.error('Error al crear la tienda:', error);
      setError(error.message || 'Ocurrió un error al crear la tienda. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">Crea Tu Tienda en ParaTodosIA</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">¡Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tienda *</label>
            <input 
              id="nombre" 
              name="nombre" 
              type="text" 
              required 
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
              placeholder="Ej: Mi Tienda Increíble" 
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción Corta</label>
            <textarea 
              id="descripcion" 
              name="descripcion" 
              rows="3" 
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
              placeholder="Describe brevemente tu tienda y qué vendes"
            ></textarea>
          </div>
          
          {/* Input para el Logo */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">Logo de la tienda *</label>
            <input 
              id="logo" 
              name="logo" 
              type="file" 
              accept="image/*" 
              required 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" 
            />
             <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
          </div>
  
          {/* Input para el Catálogo PDF */}
          <div>
            <label htmlFor="catalogo" className="block text-sm font-medium text-gray-700 mb-1">Catálogo en PDF *</label>
            <input 
              id="catalogo" 
              name="catalogo" 
              type="file" 
              accept=".pdf" 
              required 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" 
            />
            <p className="mt-1 text-xs text-gray-500">Sube tu catálogo de productos en formato PDF.</p>
          </div>
  
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Crear Mi Tienda Ahora
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormularioTienda;
