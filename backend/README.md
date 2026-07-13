# Backend local de pruebas

Este backend local permite probar dos integraciones:

- Google Calendar con OAuth y creación de eventos
- WhatsApp Cloud API con envío del template `hello_world`

## Preparación

1. Copia `backend/.env.example` a `backend/.env`
2. Completa tus credenciales de Google y WhatsApp (ver secciones abajo)
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

## Credenciales de WhatsApp Cloud API

Necesitas estas variables en `backend/.env`:

| Variable | Dónde obtenerla |
|----------|-----------------|
| `WHATSAPP_ACCESS_TOKEN` | Meta for Developers → tu app → WhatsApp → API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Misma pantalla de API Setup |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business Manager (informativo) |
| `WHATSAPP_TEST_RECIPIENT` | Número de prueba registrado en Meta (formato `50684448047`) |

```env
WHATSAPP_API_VERSION=v23.0
WHATSAPP_ACCESS_TOKEN=tu-token
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=tu-business-account-id
WHATSAPP_TEST_RECIPIENT=50684448047
```

### Prueba hello_world

La prueba envía el template oficial `hello_world` de Meta (no texto libre). El número destino debe estar registrado como número de prueba en tu app de Meta.

```json
{
  "to": "50684448047"
}
```

### Recordatorio de cita

```json
{
  "to": "50684448047",
  "patientName": "Paciente Demo",
  "appointmentDate": "6 de julio de 2026 10:00 a. m.",
  "clinicName": "Consultorio Demo"
}
```

> Los recordatorios usan `type: text` y solo funcionan dentro de la ventana de 24 horas de servicio al cliente. Para mensajes proactivos necesitas un template aprobado por Meta.

## Endpoints disponibles

- `GET /api/health`
- `GET /api/google/status`
- `GET /api/google/auth-url`
- `GET /api/google/oauth/callback`
- `GET /api/google/calendars`
- `POST /api/google/calendar/events`
- `GET /api/whatsapp/status`
- `POST /api/whatsapp/messages/test`
- `POST /api/whatsapp/messages/reminder`

### Ejemplo para crear evento en Google Calendar

```json
{
  "summary": "Cita de control",
  "description": "Paciente de prueba",
  "start": "2026-07-06T10:00:00-06:00",
  "end": "2026-07-06T10:30:00-06:00",
  "timeZone": "America/Costa_Rica",
  "attendees": ["correo@ejemplo.com"]
}
```
