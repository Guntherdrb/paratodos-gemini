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
CORS(app)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///paratodos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ───── MODELOS ─────

class Tienda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    responsable = db.Column(db.String(100))
    rif = db.Column(db.String(20))
    email = db.Column(db.String(100))
    telefono = db.Column(db.String(30))
    instagram = db.Column(db.String(100))
    direccion = db.Column(db.Text)
    productos = db.Column(db.Text) # Considerar normalizar esto si es una lista compleja
    color = db.Column(db.String(10))
    logo = db.Column(db.String(200))
    catalogo = db.Column(db.String(200))
    slug = db.Column(db.String(100), unique=True)

class Producto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    descripcion = db.Column(db.Text)
    precio = db.Column(db.String(50)) # Considerar tipo Float o Decimal
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'))
    relacionados = db.Column(db.Text)
    imagen = db.Column(db.String(200))

class Lead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # cliente = db.Column(db.String(100))
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    estado = db.Column(db.String(50), default="pendiente")
    # producto = db.relationship('Producto') # Opcional para acceso fácil
    # tienda = db.relationship('Tienda') # Opcional para acceso fácil

with app.app_context():
    db.create_all()

# ───── ENDPOINTS ─────

# --- Endpoints de Tienda --- 
@app.route('/api/crear-tienda', methods=['POST'])
def crear_tienda():
    # ... (código existente para crear tienda)
    try:
        data = request.form
        nombre = data['nombre']
        slug = nombre.lower().replace(" ", "-")

        if Tienda.query.filter_by(slug=slug).first():
            return jsonify({ "success": False, "error": "Ya existe una tienda con ese nombre" }), 400

        nueva_tienda = Tienda(
            nombre=nombre,
            slug=slug,
            responsable=data['responsable'],
            rif=data['rif'],
            email=data['email'],
            telefono=data['telefono'],
            instagram=data.get('instagram', ''),
            direccion=data['direccion'],
            productos=data['productos'],
            color=data['color']
        )

        tienda_path = os.path.join(UPLOAD_FOLDER, slug)
        os.makedirs(tienda_path, exist_ok=True)

        logo = request.files['logo']
        logo_filename = secure_filename(logo.filename)
        logo.save(os.path.join(tienda_path, logo_filename))
        nueva_tienda.logo = logo_filename

        catalogo = request.files['catalogo']
        catalogo_filename = secure_filename(catalogo.filename)
        catalogo.save(os.path.join(tienda_path, catalogo_filename))
        nueva_tienda.catalogo = catalogo_filename

        db.session.add(nueva_tienda)
        db.session.commit()

        # 🧠 Procesar PDF con IA para crear productos
        try:
            pdf_path = os.path.join(tienda_path, catalogo_filename)
            reader = PdfReader(pdf_path)
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "
"

            openai.api_key = os.getenv("OPENAI_API_KEY")
            client = openai.OpenAI()
            chat = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extrae una lista JSON de productos del catálogo con formato [{'name': '...', 'description': '...', 'price': '...'}]"},
                    {"role": "user", "content": full_text}
                ]
            )
            content = chat.choices[0].message.content
            products = json.loads(content)

            placeholder_img = os.getenv("PLACEHOLDER_IMG_URL", "https://via.placeholder.com/200")
            for prod in products:
                nuevo_prod = Producto(
                    nombre=prod.get("name", ""),
                    descripcion=prod.get("description", ""),
                    precio=prod.get("price", ""),
                    tienda_id=nueva_tienda.id,
                    imagen=placeholder_img
                )
                db.session.add(nuevo_prod)
            db.session.commit()

        except Exception as iae:
            print("❌ Error IA catálogo:", iae)

        return jsonify({ "success": True })

    except Exception as e:
        db.session.rollback()
        print("❌ Error al crear tienda:", e)
        import traceback
        traceback.print_exc()
        return jsonify({ "success": False, "error": str(e) }), 500

@app.route('/api/tienda/<slug>', methods=['GET'])
def obtener_tienda(slug):
    # ... (código existente para obtener tienda)
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({ "success": False, "error": "Tienda no encontrada" }), 404

    data = {
        "nombre": tienda.nombre,
        "responsable": tienda.responsable,
        "rif": tienda.rif,
        "email": tienda.email,
        "telefono": tienda.telefono,
        "instagram": tienda.instagram,
        "direccion": tienda.direccion,
        "productos": tienda.productos,
        "color": tienda.color,
        "logo": tienda.logo,
        "catalogo": tienda.catalogo,
        "slug": tienda.slug
    }
    return jsonify({ "success": True, "tienda": data })

@app.route('/api/tiendas', methods=['GET'])
def listar_tiendas():
    # ... (código existente para listar tiendas)
    tiendas = Tienda.query.all()
    lista = []
    for t in tiendas:
        logo_url = f"/uploads/{t.slug}/{t.logo}" if t.logo else ''
        lista.append({
            'id': t.id,
            'nombre': t.nombre,
            'slug': t.slug,
            'logo': logo_url
        })
    return jsonify({ 'success': True, 'tiendas': lista })


# --- Endpoints de Producto --- 
@app.route('/api/productos/<slug>', methods=['GET'])
def obtener_productos(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({ "success": False, "error": "Tienda no encontrada" }), 404

    # Guardamos el teléfono de la tienda para añadirlo a cada producto
    telefono_tienda = tienda.telefono if tienda else '' 

    productos = Producto.query.filter_by(tienda_id=tienda.id).all()
    lista = []
    for p in productos:
        if p.imagen:
            if p.imagen.startswith('http'):
                img_url = p.imagen
            else:
                img_url = f"/uploads/{slug}/{p.imagen}"
        else:
            img_url = ''
        # Añadimos tienda_id y telefono a la respuesta de cada producto
        lista.append({
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "precio": p.precio,
            "relacionados": p.relacionados,
            "imagen": img_url,
            "tienda_id": p.tienda_id, # Ya estaba
            "telefono": telefono_tienda # ¡Añadido!
        })

    return jsonify({ "success": True, "productos": lista })

@app.route('/api/producto/<int:id>', methods=['GET'])
def obtener_producto(id):
    # ... (código existente para obtener un producto)
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({ "success": False, "error": "Producto no encontrado" }), 404

    tienda = Tienda.query.get(producto.tienda_id)
    slug = tienda.slug if tienda else ""

    if producto.imagen:
        if producto.imagen.startswith('http'):
            img_url = producto.imagen
        else:
            img_url = f"/uploads/{slug}/{producto.imagen}"
    else:
        img_url = ''
    tienda_info = {
        "id": tienda.id if tienda else None,
        "nombre": tienda.nombre if tienda else None,
        "slug": slug,
        "instagram": tienda.instagram if tienda and tienda.instagram else None,
        "telefono": tienda.telefono if tienda and tienda.telefono else None
    }
    return jsonify({
        "success": True,
        "producto": {
            "id": producto.id,
            "nombre": producto.nombre,
            "descripcion": producto.descripcion,
            "precio": producto.precio,
            "relacionados": producto.relacionados,
            "imagen": img_url,
            "tienda": tienda_info 
        }
    })

@app.route('/api/producto/<int:id>', methods=['PUT'])
def editar_producto(id):
    # ... (código existente para editar producto)
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({ "success": False, "error": "Producto no encontrado" }), 404

    data = request.form
    producto.nombre = data['nombre']
    producto.descripcion = data['descripcion']
    producto.precio = data['precio']
    producto.relacionados = data.get('relacionados', '')
    slug = data['slug'] # Se necesita para la carpeta de imagen

    if 'imagen' in request.files:
        imagen = request.files['imagen']
        if imagen.filename:
            # Necesitamos obtener la tienda para construir la ruta
            # Podríamos obtenerla del producto.tienda_id si tuviéramos la relación, 
            # o buscarla por slug como se hace aquí (requiere que el slug se envíe)
            tienda = Tienda.query.filter_by(slug=slug).first()
            if tienda:
                tienda_path = os.path.join(app.config['UPLOAD_FOLDER'], slug)
                os.makedirs(tienda_path, exist_ok=True)
                imagen_filename = secure_filename(imagen.filename)
                imagen.save(os.path.join(tienda_path, imagen_filename))
                producto.imagen = imagen_filename
            else:
                 print(f"Advertencia: No se encontró tienda con slug {slug} al intentar guardar imagen para producto {id}")

    db.session.commit()
    return jsonify({ "success": True, "message": "Producto actualizado" })

@app.route('/api/crear-producto', methods=['POST'])
def crear_producto():
    # ... (código existente para crear producto)
    try:
        data = request.form
        nombre = data['nombre']
        descripcion = data['descripcion']
        precio = data['precio']
        relacionados = data.get('relacionados', '')
        slug = data['slug'] # Necesario para encontrar tienda_id

        tienda = Tienda.query.filter_by(slug=slug).first()
        if not tienda:
            return jsonify({"success": False, "error": "Tienda no encontrada"}), 404

        imagen_filename = ''
        if 'imagen' in request.files:
            imagen = request.files['imagen']
            if imagen.filename:
                tienda_path = os.path.join(UPLOAD_FOLDER, slug)
                os.makedirs(tienda_path, exist_ok=True)
                imagen_filename = secure_filename(imagen.filename)
                imagen.save(os.path.join(tienda_path, imagen_filename))

        nuevo_producto = Producto(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            relacionados=relacionados,
            tienda_id=tienda.id, 
            imagen=imagen_filename
        )

        db.session.add(nuevo_producto)
        db.session.commit()

        return jsonify({ "success": True, "message": "Producto creado correctamente" })

    except Exception as e:
        db.session.rollback()
        print("Error al crear producto:", e)
        return jsonify({ "success": False, "error": str(e) }), 400

@app.route('/api/productos', methods=['GET'])
def listar_todos_productos():
    # ... (código existente para listar todos los productos)
    productos = Producto.query.all()
    lista = []
    for p in productos:
        tienda = Tienda.query.get(p.tienda_id)
        slug = tienda.slug if tienda else ''
        if p.imagen and p.imagen.startswith('http'):
            img_url = p.imagen
        elif p.imagen:
            img_url = f"/uploads/{slug}/{p.imagen}"
        else:
            img_url = ''
        telefono = tienda.telefono if tienda and tienda.telefono else ''
        instagram = tienda.instagram if tienda and tienda.instagram else ''
        lista.append({
            'id': p.id,
            'nombre': p.nombre,
            'descripcion': p.descripcion,
            'precio': p.precio,
            'relacionados': p.relacionados,
            'imagen': img_url,
            'slug': slug,
            'telefono': telefono, 
            'instagram': instagram,
            'tienda_id': p.tienda_id 
        })
    return jsonify({ 'success': True, 'productos': lista })


# --- Endpoints de Leads (NUEVOS) --- 
@app.route('/api/leads', methods=['POST'])
def crear_lead():
    data = request.json
    producto_id = data.get('producto_id')
    tienda_id = data.get('tienda_id')

    if not producto_id or not tienda_id:
        return jsonify({"success": False, "error": "Faltan datos (producto_id, tienda_id)"}), 400
    
    producto = Producto.query.get(producto_id)
    tienda = Tienda.query.get(tienda_id)

    if not producto:
         return jsonify({"success": False, "error": "Producto no encontrado"}), 404
    if not tienda:
         return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    if producto.tienda_id != tienda.id:
         return jsonify({"success": False, "error": "El producto no pertenece a la tienda especificada"}), 400

    try:
        nuevo_lead = Lead(producto_id=producto_id, tienda_id=tienda_id)
        db.session.add(nuevo_lead)
        db.session.commit()
        return jsonify({"success": True, "message": "Lead creado", "lead_id": nuevo_lead.id}), 201
    except Exception as e:
        db.session.rollback()
        print("Error al crear lead:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/leads/<slug>', methods=['GET'])
def obtener_leads_tienda(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({ "success": False, "error": "Tienda no encontrada" }), 404
    
    try:
        count = Lead.query.filter_by(tienda_id=tienda.id).count()
        return jsonify({ "success": True, "count": count })
    except Exception as e:
        print(f"Error al obtener leads para tienda {slug}:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# --- Endpoint para servir archivos --- 
@app.route('/uploads/<slug>/<filename>')
def serve_upload(slug, filename):
    path = os.path.join(UPLOAD_FOLDER, slug)
    return send_from_directory(path, filename)


# ───── MAIN ─────
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000)) 
    app.run(host='0.0.0.0', port=port, debug=True)
