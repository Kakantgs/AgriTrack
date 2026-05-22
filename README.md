# AgriTrack

Aplicação operacional de rastreamento agrícola para monitoramento de tratores em tempo real, com Firebase Realtime Database, telemetria real, cercas digitais, histórico e alertas.

## Stack

- Frontend: React + TypeScript + Tailwind CSS + Leaflet
- Backend: Node.js + Express + Firebase Admin + WebSocket
- Banco: Firebase Realtime Database
- Entrada de posições: `POST /api/telemetry`

## Como rodar

### Pré-requisitos

- Node.js 20+
- npm 10+
- `backend/service-account.json` com credencial Firebase Admin

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend/API/WebSocket: `http://localhost:4000`

O frontend usa `frontend/.env` quando existir:

```env
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000
```

## Firebase

O backend carrega `backend/firebase.env` automaticamente. A credencial admin deve ficar em:

```text
backend/service-account.json
```

Também é possível apontar outro caminho no `backend/firebase.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=C:\caminho\service-account.json
```

Sem credencial admin válida, o backend retorna erro e não grava dados fora do Firebase.

## Fluxo operacional

1. O usuário cria conta na tela de login.
2. O usuário cadastra propriedades, tratores e cercas digitais.
3. Um dispositivo real envia posições para `POST /api/telemetry`.
4. O backend valida a posição contra a cerca vinculada ao trator.
5. O backend atualiza trator, histórico, mapa em tempo real e alertas.
6. Se houver `WHATSAPP_WEBHOOK_URL`, o backend tenta enviar o alerta para o webhook configurado.

## Exemplo de telemetria

```http
POST http://localhost:4000/api/telemetry
Content-Type: application/json
```

```json
{
  "deviceCode": "ESP32-GPS-001",
  "deviceToken": "TOKEN_DO_DISPOSITIVO",
  "latitude": -21.7317,
  "longitude": -43.3488,
  "timestamp": "2026-05-15T12:00:00Z",
  "speed": 12,
  "battery": 87
}
```

O `deviceCode` e o `deviceToken` devem estar cadastrados em um trator.

## API principal

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET/PUT /api/users/:id`
- `GET/POST /api/properties`
- `GET/POST /api/devices`
- `GET/POST /api/geofences`
- `GET /api/history`
- `GET /api/alerts`
- `GET /api/dashboard`
- `GET /api/realtime`
- `POST /api/telemetry`
- `WS ws://localhost:4000`

## WhatsApp

Configure no `backend/firebase.env`:

```env
WHATSAPP_WEBHOOK_URL=https://sua-api.exemplo/webhook
WHATSAPP_WEBHOOK_TOKEN=token-opcional
```

O backend envia `POST` com `message`, `deviceId`, `deviceName`, `geofenceName`, `type` e `createdAt`. Sem webhook configurado, o alerta fica com status `pendente`.

## Observações técnicas

- O backend não inicia loop automático de posições.
- O backend não salva em JSON local quando o Firebase falha.
- A ingestão de telemetria está em `backend/src/services/telemetryService.ts`.
- A lógica de geofence está em `backend/src/services/geofenceService.ts`.
