# Backend local de pruebas

Este backend local permite probar la integración con Google Calendar.

## Preparación

1. Copia `backend/.env.example` a `backend/.env`
2. Completa tus credenciales de Google (ver sección abajo)
3. Instala dependencias:

```bash
npm install --prefix backend
```

4. Inicia el backend y el frontend en terminales separadas:

```bash
npm run backend:dev
npm run dev
```

## Credenciales de Google Calendar

**No necesitas una API key.** Google Calendar usa OAuth 2.0 con un Client ID y Client Secret.

### Pasos en Google Cloud Console

1. Entra a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Ve a **APIs y servicios → Biblioteca** y habilita **Google Calendar API**
4. Ve a **APIs y servicios → Pantalla de consentimiento OAuth** y configúrala (tipo: Externo o Interno)
5. Ve a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**
6. Tipo de aplicación: **Aplicación web**
7. Agrega esta URI de redirección autorizada:
   ```
   http://localhost:3001/api/google/oauth/callback
   ```
8. Copia el **Client ID** y **Client Secret** a `backend/.env`:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/oauth/callback
GOOGLE_CALENDAR_ID=primary
```

### Conectar desde la app

1. Abre `http://localhost:5173/agenda`
2. Haz clic en **Conectar Google Calendar**
3. Inicia sesión con Google y acepta permisos
4. Google te redirige de vuelta a la app; el estado cambia a **Google conectado**

El token queda guardado en `backend/.tokens/google-oauth.json` (no lo subas a git).

## Endpoints disponibles

- `GET /api/health`
- `GET /api/expediente`
- `GET /api/google/status`
- `GET /api/google/auth-url`
- `GET /api/google/oauth/callback`
- `GET /api/google/calendars`
- `POST /api/google/calendar/events`
- `POST /api/solicitudes-analisis`
- `PUT /api/solicitudes-analisis/:id`
- `DELETE /api/solicitudes-analisis/:id`

### Ejemplo para crear evento en Google Calendar

```json
{
  "summary": "Cita de control",
  "description": "Paciente de prueba",
  "start": "2026-07-06T10:00:00-06:00",
  "end": "2026-07-06T10:30:00-06:00",
  "timeZone": "America/Costa_Rica"
}
```

## Base de datos

Si ya tenías una base de datos creada antes de agregar solicitudes de análisis, ejecuta en Supabase el bloque de `solicitudes_analisis` del archivo `backend/supabase-schema.sql`.
