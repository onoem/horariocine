# HorarioCine

Aplicación web moderna para consultar los horarios de las películas en cines locales.

## Características

- **Actualización Diaria**: Los horarios se actualizan automáticamente cada día mediante GitHub Actions.
- **Buscador**: Busca películas por título de forma instantánea.
- **Filtro por Fecha**: Consulta qué películas se proyectan cada día de la semana.
- **Compra de Entradas**: Enlaces directos a la plataforma de compra para cada sesión.
- **Diseño Responsive**: Optimizado para móviles y escritorio con una estética premium.

## Cómo funciona

1. El flujo de GitHub Actions descarga la programación de fuentes externas diariamente.
2. Un script en Node.js (`scrape.js`) extrae los títulos, imágenes, sinopsis y horarios.
3. Los datos se guardan en `data.json`.
4. La aplicación web (`index.html`) carga y muestra los datos dinámicamente.

## Hosting

La aplicación se puede hospedar de forma gratuita en GitHub Pages.
Para activarlo: `Settings > Pages > Build and deployment > Source: Deploy from a branch (main)`.

## Desarrollo

Para ejecutar localmente:
1. `npm install`
2. `node scrape.js` (opcional, si quieres refrescar datos)
3. Abre `index.html` con un servidor local (p.ej. `npx serve .`).
