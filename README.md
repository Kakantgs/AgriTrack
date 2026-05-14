# AgriTrack

Protótipo funcional de rastreamento agrícola para monitoramento de tratores em tempo real, com simulador GPS, cerca virtual, alertas visuais e WhatsApp simulado.

## Stack

- Frontend: React + TypeScript + Tailwind CSS + Leaflet
- Backend: Node.js + Express + Firebase Realtime Database + WebSocket
- Simulação: trajeto GPS automático no backend com validação de geofence

## Estrutura

```text
AgriTrack/
  frontend/
  backend/
  README.md
  package.json
```

## Como rodar

### Pré-requisitos

- Node.js 20+
- npm 10+

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

### Login inicial

- Usuário: `admin@agritrack.com`
- Senha: `123456`

## Funcionalidades entregues

- Login simples para protótipo
- Cadastro de propriedades e tratores
- Dashboard com total de tratores, online, última posição e status
- Mapa com OpenStreetMap e marcador em tempo real
- Simulador GPS movendo o trator automaticamente
- Geofence com criação por clique no mapa
- Detecção de saída da cerca virtual
- Histórico de posições com filtros
- Registro e visualização de alertas
- Simulação de envio de alerta para WhatsApp

## Fluxo da simulação

1. O backend inicia com dados seed.
2. Um intervalo de 5 segundos move o trator por um trajeto fixo.
3. Cada nova posição é persistida no Firebase Realtime Database.
4. A posição é comparada com o polígono da cerca virtual.
5. Quando o status muda de `inside` para `outside`, o sistema grava um alerta com a mensagem:

```text
Alerta AgriTrack: o trator [NOME] saiu da cerca virtual [NOME_DA_CERCA] às [HORÁRIO].
```

6. O backend publica a atualização por WebSocket.
7. O frontend atualiza dashboard, mapa e alerta visual.

## API principal

- `POST /api/auth/login`
- `GET/POST /api/properties`
- `GET/POST /api/devices`
- `GET/POST /api/geofences`
- `GET /api/history`
- `GET /api/alerts`
- `GET /api/dashboard`
- `GET /api/realtime`
- `WS ws://localhost:4000`

## Integrações futuras

### Traccar

- Substituir o simulador por ingestão real do Traccar.
- Consumir posições pela API REST ou WebSocket/Event Forwarder do Traccar.
- Mapear `deviceId`, `position`, `geofence` e `events` para o modelo do AgriTrack.
- Manter o frontend atual e trocar a origem dos dados para o Traccar.

### ESP32 + GPS NEO-6M + SIM800L

- O ESP32 pode ler latitude/longitude do NEO-6M.
- O SIM800L pode enviar os dados por HTTP ou MQTT.
- Um endpoint futuro no backend pode receber payloads como:

```json
{
  "deviceCode": "ESP32-GPS-001",
  "latitude": -21.7317,
  "longitude": -43.3488,
  "timestamp": "2026-05-14T12:00:00Z"
}
```

- Esses dados podem ser persistidos diretamente ou encaminhados ao Traccar.

### WhatsApp

- Substituir o status `simulado` por integração com Evolution API ou Z-API.
- No momento do alerta, enviar a mensagem para um número configurado.
- Registrar no banco o retorno real da API para marcar `enviado` ou `erro`.

## Observações técnicas

- O backend usa o Firebase Realtime Database informado na configuração do projeto.
- O simulador está em `backend/src/services/gpsSimulator.ts`.
- A lógica de geofence está em `backend/src/services/geofenceService.ts`.
- O projeto foi estruturado para facilitar a troca do backend simulado por Traccar no futuro.
