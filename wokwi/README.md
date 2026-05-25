# AgriTrack Wokwi ESP32

Este projeto simula um ESP32 enviando telemetria real para o backend do AgriTrack.

## Como usar

1. Rode o backend:

   ```powershell
   npm run start --workspace backend
   ```

2. Exponha a porta local para o Wokwi. Exemplo com ngrok:

   ```powershell
   ngrok http 4000
   ```

3. No AgriTrack, cadastre um trator com o codigo:

   ```txt
   ESP32-AGRI-001
   ```

4. Copie o token exibido no card do trator.

5. No `sketch.ino`, troque:

   ```cpp
   const char* servidor = "https://SEU-SERVIDOR.com/api/telemetry";
   const char* deviceToken = "COLE_AQUI_O_TOKEN_DO_TRATOR";
   ```

   por:

   ```cpp
   const char* servidor = "https://SUA_URL_NGROK/api/telemetry";
   const char* deviceToken = "TOKEN_REAL_DO_TRATOR";
   ```

6. Cadastre uma cerca virtual no app em volta da regiao:

   ```txt
   -21.731700, -43.348800
   ```

7. Abra os arquivos desta pasta no Wokwi e inicie a simulacao.

## O que a simulacao faz

- Envia `POST /api/telemetry` a cada 5 segundos.
- Atualiza latitude, longitude, velocidade e bateria.
- Liga o LED verde quando o WiFi esta conectado.
- Liga o LED vermelho quando a posicao simulada sai da cerca local.
- Ao apertar o botao azul, envia uma coordenada fora da cerca para forcar alerta no app.
