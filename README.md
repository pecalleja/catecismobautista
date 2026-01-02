# El Catecismo Bautista con Beddome

El Catecismo Bautista (1693) con la Exposición Bíblica de Benjamin Beddome (1717-1795).

## Sitio Web

El sitio web está disponible en: **https://www.catecismobautista.org**

## Desarrollo Local

### Requisitos

- Python 3.11 o superior
- [uv](https://docs.astral.sh/uv/) (gestor de paquetes)

### Instalacion

```bash
# Instalar dependencias
uv sync

# Instalar dependencias de desarrollo (opcional)
uv sync --extra dev

# Configurar pre-commit hooks
uv run pre-commit install
```

### Construir el sitio

```bash
# Generar el sitio estatico
uv run python -m generator.build
```

El sitio se generara en la carpeta `docs/`.

### Servir localmente

```bash
# Servir el sitio en http://localhost:8000
uv run python -m http.server 8000 -d docs
```

Abrir http://localhost:8000 en el navegador.

## Estructura del Proyecto

```
/
├── catecismo-bautista-con-beddome-es.json   # Datos del catecismo
├── generator/                                # Generador de sitio estatico
│   ├── build.py                             # Script principal
│   └── templates/                           # Plantillas Jinja2
│       ├── base.html
│       ├── index.html
│       ├── question.html
│       └── search.html
├── static/                                  # Archivos estaticos
│   ├── css/styles.css
│   └── js/
│       ├── main.js
│       └── search.js
├── docs/                                    # Sitio generado (GitHub Pages)
└── .github/workflows/deploy.yml             # CI/CD
```

## Despliegue

El sitio se despliega automaticamente en GitHub Pages cuando se hace push a la rama `master` o `main`.

### Configuracion de dominio personalizado

1. **En GitHub**: Settings > Pages > Custom domain: `www.catecismobautista.org`

2. **En el registrador de dominio**, agregar registros DNS:
   - A record: `185.199.108.153`
   - A record: `185.199.109.153`
   - A record: `185.199.110.153`
   - A record: `185.199.111.153`
   - CNAME: `www` -> `legadobautistaconfesional.github.io`

3. Esperar propagacion DNS (hasta 48 horas, usualmente menos de 1 hora)

4. Habilitar HTTPS en GitHub Pages settings

## Google Analytics

El sitio incluye Google Analytics 4 para tracking de visitas e interacciones.

### Configuracion

1. Crear una propiedad en [Google Analytics](https://analytics.google.com/)
2. Obtener el Measurement ID (formato: `G-XXXXXXXXXX`)
3. Reemplazar `G-XXXXXXXXXX` en `generator/templates/base.html`

### Eventos trackeados

- `theme_toggle`: Cambio de tema (claro/oscuro)
- `keyboard_nav`: Navegacion con teclado
- `search`: Busquedas realizadas
- `search_result_click`: Clicks en resultados de busqueda

## Desarrollo

### Calidad de codigo

El proyecto usa pre-commit hooks para mantener la calidad del codigo:

| Herramienta          | Archivos      | Funcion                             |
|----------------------|---------------|-------------------------------------|
| **Ruff**             | Python        | Linting y formateo                  |
| **Bandit**           | Python        | Analisis de seguridad               |
| **Prettier**         | JS, CSS, JSON | Formateo                            |
| **djLint**           | Jinja2/HTML   | Linting y formateo de templates     |
| **pre-commit-hooks** | Todos         | Trailing whitespace, EOF, YAML/JSON |

```bash
# Ejecutar manualmente todos los checks
uv run pre-commit run --all-files

# Python
uv run ruff check . --fix
uv run ruff format .
uv run bandit -r generator/

# Jinja templates
uv run djlint generator/templates/ --lint
uv run djlint generator/templates/ --reformat
```

## Tecnologias

- **Generador**: Python + Jinja2
- **Frontend**: HTML + CSS + JavaScript (vanilla)
- **Busqueda**: Fuse.js (cliente)
- **Analytics**: Google Analytics 4
- **Hosting**: GitHub Pages (gratis)
- **CI/CD**: GitHub Actions
- **Linting**: Ruff, Bandit, Prettier, djLint

## Licencia

El contenido del Catecismo Bautista es de dominio publico.
