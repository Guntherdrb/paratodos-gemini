from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import datetime
import json
import openai
from PyPDF2 import PdfReader
from dotenv import load_dotenv
load_dotenv()

# ───── CONFIGURACIÓN ─────
app = Flask(__name__)
CORS(app) # Permite CORS para todas las rutas

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'backend', 'uploads') # Ruta correcta a uploads dentro de backend
INSTANCE_FOLDER = os.path.join(os.getcwd(), 'backend', 'instance') # Ruta correcta a instance dentro de backend

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INSTANCE_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(INSTANCE_FOLDER, "paratodos.db")}' # Ruta completa a la BD
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Configuración de OpenAI (mejor usar variables de entorno)
openai.api_key = os.getenv("OPENAI_API_KEY")

# ───── MODELOS ─────
class Tienda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    # Campos adicionales que podrían ser útiles para el marketplace
    descripcion = db.Column(db.Text, nullable=True) 
    # responsable = db.Column(db.String(100))
    # rif = db.Column(db.String(20))
    # email = db.Column(db.String(100))
    # telefono = db.Column(db.String(30))
    # instagram = db.Column(db.String(100))
    # direccion = db.Column(db.Text)
    # productos = db.Column(db.Text) # Ya no parece necesario si usamos la tabla Producto
    # color = db.Column(db.String(10))
    logo_filename = db.Column(db.String(200), nullable=True) # Nombre del archivo logo
    catalogo_filename = db.Column(db.String(200), nullable=True) # Nombre del archivo catálogo
    slug = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relación con productos
    productos = db.relationship('Producto', backref='tienda', lazy=True, cascade="all, delete-orphan")

class Producto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    precio = db.Column(db.String(50), nullable=True) # Considerar usar Float o Decimal
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'), nullable=False)
    # relacionados = db.Column(db.Text) # ¿Aún se usa?
    imagen_filename = db.Column(db.String(200), nullable=True) # Nombre del archivo imagen si se sube
    imagen_url_externa = db.Column(db.String(500), nullable=True) # O URL externa (ej. placeholder)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Podríamos eliminar Leads si no se usa activamente, o desarrollarlo más
# class Lead(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     cliente = db.Column(db.String(100))
#     producto = db.Column(db.String(100))
#     tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'))
#     fecha = db.Column(db.DateTime, default=datetime.datetime.utcnow)
#     estado = db.Column(db.String(50), default="pendiente")

with app.app_context():
    db.create_all()

# ───── FUNCIONES AUXILIARES ─────
def procesar_catalogo_pdf(pdf_path, tienda_id):
    """Extrae texto del PDF y usa OpenAI para obtener productos."""
    productos_extraidos = []
    try:
        reader = PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "

" # Añade separación entre páginas
        
        # Limita el texto para no exceder límites de tokens (ajustar según necesidad)
        max_chars = 15000 # Aproximado para gpt-3.5-turbo (4k tokens ~ 16k chars, pero varía)
        if len(full_text) > max_chars:
             print(f"Advertencia: El texto del PDF excede los {max_chars} caracteres, truncando.")
             full_text = full_text[:max_chars]

        if not full_text.strip():
            print("Advertencia: No se pudo extraer texto del PDF.")
            return productos_extraidos
        
        if not openai.api_key:
             print("Error: OPENAI_API_KEY no configurada.")
             return productos_extraidos

        client = openai.OpenAI()
        prompt = f"""Eres un asistente experto en extraer información de catálogos de productos en formato PDF. Analiza el siguiente texto y devuelve una lista JSON de productos. Cada objeto JSON debe tener las claves 'nombre' (string), 'descripcion' (string, opcional pero recomendado), y 'precio' (string, opcional). Si no encuentras un valor, omite la clave o déjala vacía. Sé lo más preciso posible. El texto es:
        --- INICIO TEXTO ---
        {full_text}
        --- FIN TEXTO ---
        Formato de salida esperado: JSON Array [{"nombre": "...", "descripcion": "...", "precio": "..."}, ...]"""
        
        chat = client.chat.completions.create(
            model="gpt-3.5-turbo", # O un modelo más avanzado si es necesario
            messages=[
                #{"role": "system", "content": "Extrae una lista JSON de productos del catálogo con formato [{'nombre': '...', 'descripcion': '...', 'precio': '...'}]. Sé preciso."}, 
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" } # Solicitar formato JSON si el modelo lo soporta
        )
        content = chat.choices[0].message.content
        
        # Intenta parsear el JSON
        # El modelo puede devolver un objeto con una clave (ej. "productos") o directamente el array
        try:
            parsed_json = json.loads(content)
            if isinstance(parsed_json, list): # Directamente una lista
                productos_extraidos = parsed_json
            elif isinstance(parsed_json, dict):
                 # Busca una clave que contenga una lista (ej. 'productos', 'items', etc.)
                 for key, value in parsed_json.items():
                      if isinstance(value, list):
                           productos_extraidos = value
                           break # Toma la primera lista encontrada
                 if not productos_extraidos:
                      print(f"Advertencia: Respuesta JSON de IA es un diccionario, pero no se encontró una lista de productos: {parsed_json}")       
            else:
                print(f"Advertencia: Respuesta JSON de IA no es una lista ni un diccionario esperado: {parsed_json}")

        except json.JSONDecodeError as jde:
            print(f"Error al decodificar JSON de OpenAI: {jde}")
            print(f"Contenido recibido: {content}")

        # Filtrar productos sin nombre (obligatorio)
        productos_validos = [p for p in productos_extraidos if p.get('nombre')] 
        print(f"Productos extraídos y válidos: {len(productos_validos)}")
        return productos_validos

    except Exception as e:
        print(f"Error procesando PDF o llamando a OpenAI: {e}")
        return [] # Devuelve lista vacía en caso de error

# ───── ENDPOINTS ─────

# Endpoint para crear una nueva tienda (mejorado)
@app.route('/api/tiendas', methods=['POST'])
def api_crear_tienda():
    try:
        data = request.form
        nombre_tienda = data.get('nombre')
        logo_file = request.files.get('logo')
        catalogo_file = request.files.get('catalogo')
        descripcion_tienda = data.get('descripcion', '') # Descripcion opcional

        if not nombre_tienda or len(nombre_tienda) < 3:
            return jsonify({"success": False, "message": "El nombre de la tienda es requerido (mínimo 3 caracteres)."}), 400
        if not logo_file:
             return jsonify({"success": False, "message": "El logo es requerido."}), 400
        if not catalogo_file:
             return jsonify({"success": False, "message": "El catálogo PDF es requerido."}), 400
             
        # Crear slug único
        base_slug = secure_filename(nombre_tienda.lower().replace(' ', '-'))
        slug = base_slug
        counter = 1
        while Tienda.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Crear directorio para la tienda si no existe
        tienda_path = os.path.join(app.config['UPLOAD_FOLDER'], slug)
        os.makedirs(tienda_path, exist_ok=True)

        # Guardar logo
        logo_filename = secure_filename(f"logo_{slug}{os.path.splitext(logo_file.filename)[1]}")
        logo_path = os.path.join(tienda_path, logo_filename)
        logo_file.save(logo_path)

        # Guardar catálogo
        catalogo_filename = secure_filename(f"catalogo_{slug}{os.path.splitext(catalogo_file.filename)[1]}")
        catalogo_path = os.path.join(tienda_path, catalogo_filename)
        catalogo_file.save(catalogo_path)

        # Crear tienda en la BD
        nueva_tienda = Tienda(
            nombre=nombre_tienda,
            slug=slug,
            descripcion=descripcion_tienda, 
            logo_filename=logo_filename,
            catalogo_filename=catalogo_filename
        )
        db.session.add(nueva_tienda)
        db.session.commit() # Guarda la tienda para obtener su ID

        # Procesar catálogo PDF para extraer productos
        productos_extraidos = procesar_catalogo_pdf(catalogo_path, nueva_tienda.id)

        # Guardar productos extraídos en la BD
        for prod_data in productos_extraidos:
             # Podríamos añadir un placeholder de imagen aquí si quisiéramos
            # imagen_placeholder = os.getenv("PLACEHOLDER_IMG_URL", "https://via.placeholder.com/200")
            nuevo_prod = Producto(
                nombre=prod_data.get('nombre'),
                descripcion=prod_data.get('descripcion'),
                precio=prod_data.get('precio'),
                tienda_id=nueva_tienda.id,
                # imagen_url_externa=imagen_placeholder # Ejemplo si usamos placeholder
            )
            db.session.add(nuevo_prod)
        
        if productos_extraidos: # Solo commitear si se añadieron productos
            db.session.commit()

        return jsonify({
             "success": True, 
             "message": f"Tienda '{nombre_tienda}' creada exitosamente.",
             "tienda_slug": slug,
             "productos_extraidos": len(productos_extraidos)
             }), 201

    except Exception as e:
        db.session.rollback() # Deshacer cambios en BD si algo falla
        print(f"❌ Error al crear tienda: {e}")
        import traceback
        traceback.print_exc() # Imprime el stack trace completo para depuración
        return jsonify({ "success": False, "message": f"Error interno del servidor: {str(e)}" }), 500

# Endpoint para obtener datos públicos de UNA tienda por slug
@app.route('/api/tienda/<slug>', methods=['GET'])
def api_obtener_tienda(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({ "success": False, "message": "Tienda no encontrada" }), 404

    logo_url = f"/uploads/{tienda.slug}/{tienda.logo_filename}" if tienda.logo_filename else None
    catalogo_url = f"/uploads/{tienda.slug}/{tienda.catalogo_filename}" if tienda.catalogo_filename else None

    data = {
        "id": tienda.id,
        "nombre": tienda.nombre,
        "slug": tienda.slug,
        "descripcion": tienda.descripcion,
        "logo_url": logo_url,
        "catalogo_url": catalogo_url,
        "created_at": tienda.created_at.isoformat() # Formato estándar
        # Podrías añadir más datos si fueran públicos (ej. redes sociales si las modelas)
    }
    return jsonify({ "success": True, "tienda": data })

# Endpoint para obtener productos de UNA tienda por slug
@app.route('/api/productos/<slug>', methods=['GET'])
def api_obtener_productos_por_tienda(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({ "success": False, "message": "Tienda no encontrada" }), 404

    productos = Producto.query.filter_by(tienda_id=tienda.id).order_by(Producto.created_at.desc()).all()
    lista_productos = []
    for p in productos:
        # Determinar URL de imagen (externa o local)
        if p.imagen_url_externa:
            img_url = p.imagen_url_externa
        elif p.imagen_filename:
            img_url = f"/uploads/{slug}/{p.imagen_filename}"
        else:
            img_url = None # O un placeholder por defecto si prefieres
        
        lista_productos.append({
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "precio": p.precio,
            "imagen_url": img_url,
            "created_at": p.created_at.isoformat()
        })

    return jsonify({ "success": True, "productos": lista_productos })
    
# --- NUEVO ENDPOINT PARA MARKETPLACE --- 
# Endpoint para listar TODAS las tiendas (para el Marketplace)
@app.route('/api/tiendas/lista', methods=['GET'])
def api_listar_tiendas_marketplace():
    try:
        # Ordenar por fecha de creación, las más nuevas primero
        tiendas = Tienda.query.order_by(Tienda.created_at.desc()).all()
        lista_tiendas = []
        for t in tiendas:
            logo_url = f"/uploads/{t.slug}/{t.logo_filename}" if t.logo_filename else None
            lista_tiendas.append({
                'id': t.id,
                'nombre': t.nombre,
                'slug': t.slug,
                'descripcion': t.descripcion, # Añadir descripción si existe
                'logo_url': logo_url,
                'created_at': t.created_at.isoformat()
            })
        return jsonify({ 'success': True, 'tiendas': lista_tiendas })
    except Exception as e:
        print(f"Error al listar tiendas para marketplace: {e}")
        return jsonify({ "success": False, "message": "Error interno al obtener tiendas"}), 500

# Endpoint para servir archivos subidos (logos, catálogos, imágenes de producto)
# Asegúrate que esta ruta no colisione con otros endpoints API
@app.route('/uploads/<path:subpath>')
def serve_uploaded_file(subpath):
    # subpath será algo como "nombre-tienda-slug/logo_tienda.jpg"
    return send_from_directory(app.config['UPLOAD_FOLDER'], subpath)


# ───── ENDPOINTS DE PRODUCTOS (CRUD - A implementar/mejorar si es necesario) ─────
# GET /api/producto/{id} - Obtener detalles de un producto específico (ya existe, revisar si necesita cambios)
# PUT /api/producto/{id} - Editar un producto (ya existe, revisar si necesita cambios)
# DELETE /api/producto/{id} - Eliminar un producto (NUEVO)
# POST /api/productos/{slug} - Crear un nuevo producto manualmente para una tienda (NUEVO, diferente a crear tienda)

# ───── MAIN ─────
if __name__ == '__main__':
    # Considera cambiar el host a '0.0.0.0' si necesitas acceder desde otros dispositivos en tu red
    app.run(host='0.0.0.0', port=5000, debug=True) # debug=True solo para desarrollo
