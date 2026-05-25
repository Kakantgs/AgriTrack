#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// =======================
// PINOS DO DIAGRAM.JSON
// =======================
#define LED_ALERTA 2
#define LED_ONLINE 4
#define BOTAO_TESTE 18

// OLED I2C
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_SDA 21
#define OLED_SCL 22

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// =======================
// WIFI WOKWI
// =======================
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// =======================
// AGRITRACK API
// =======================
// Use a URL publica para o backend local. Exemplo com ngrok:
// const char* servidor = "https://abc123.ngrok-free.app/api/telemetry";
const char* servidor = "https://SEU-SERVIDOR.com/api/telemetry";

// Copie estes valores da tela "Tratores cadastrados" no AgriTrack.
const char* deviceCode = "ESP32-AGRI-001";
const char* deviceToken = "COLE_AQUI_O_TOKEN_DO_TRATOR";

// =======================
// CERCA LOCAL SIMULADA
// =======================
// Esta cerca controla LED/OLED no Wokwi. A cerca real do sistema e a cadastrada no app.
// Cadastre no AgriTrack uma cerca em volta destes pontos para ver alertas reais.
const double centroLat = -21.731700;
const double centroLng = -43.348800;
const double raioPermitido = 120.0; // metros

// =======================
// ROTA SIMULADA DO TRATOR
// =======================
double rota[][2] = {
  {-21.731700, -43.348800}, // centro
  {-21.731420, -43.348550}, // dentro
  {-21.731150, -43.348300}, // dentro
  {-21.730900, -43.348050}, // proximo do limite
  {-21.730650, -43.347820}, // limite
  {-21.730250, -43.347450}, // fora
  {-21.729850, -43.347080}, // fora
  {-21.731500, -43.348650}  // voltou
};

const double alertaManualLat = -21.729600;
const double alertaManualLng = -43.346900;

int indiceRota = 0;
int totalPontos = sizeof(rota) / sizeof(rota[0]);

unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 5000;

int ultimoHttpCode = 0;
String ultimoStatusEnvio = "Aguardando";

// =======================
// FUNCOES AUXILIARES
// =======================
double grausParaRadianos(double graus) {
  return graus * PI / 180.0;
}

double calcularDistanciaMetros(double lat1, double lng1, double lat2, double lng2) {
  const double raioTerra = 6371000.0;
  double dLat = grausParaRadianos(lat2 - lat1);
  double dLng = grausParaRadianos(lng2 - lng1);

  double a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(grausParaRadianos(lat1)) *
    cos(grausParaRadianos(lat2)) *
    sin(dLng / 2) * sin(dLng / 2);

  return raioTerra * (2 * atan2(sqrt(a), sqrt(1 - a)));
}

bool servidorConfigurado() {
  String url = String(servidor);
  return url.indexOf("SEU-SERVIDOR") < 0 &&
         (url.startsWith("http://") || url.startsWith("https://")) &&
         url.endsWith("/api/telemetry");
}

bool credenciaisConfiguradas() {
  return String(deviceCode).length() > 0 &&
         String(deviceToken).length() > 20 &&
         String(deviceToken).indexOf("COLE_AQUI") < 0;
}

void mostrarOLED(double lat, double lng, double distancia, bool foraDaCerca, bool botaoPressionado) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.print("AgriTrack Wokwi");

  display.setCursor(0, 12);
  display.print("WiFi: ");
  display.print(WiFi.status() == WL_CONNECTED ? "ONLINE" : "OFFLINE");

  display.setCursor(0, 23);
  display.print("Lat:");
  display.print(lat, 5);

  display.setCursor(0, 33);
  display.print("Lng:");
  display.print(lng, 5);

  display.setCursor(0, 43);
  display.print("Dist:");
  display.print(distancia, 0);
  display.print("m HTTP:");
  display.print(ultimoHttpCode);

  display.setCursor(0, 54);
  if (botaoPressionado) {
    display.print("ALERTA MANUAL");
  } else if (foraDaCerca) {
    display.print("FORA DA CERCA");
  } else {
    display.print("DENTRO DA CERCA");
  }

  display.display();
}

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_ONLINE, HIGH);
    return;
  }

  Serial.println();
  Serial.println("Conectando ao WiFi Wokwi...");
  WiFi.begin(ssid, password, 6);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 30) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_ONLINE, HIGH);
    Serial.println("WiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(LED_ONLINE, LOW);
    Serial.println("Falha ao conectar no WiFi.");
  }
}

String montarPayload(double lat, double lng, bool alertaManual) {
  double velocidade = alertaManual ? 0.0 : 12.5;
  int bateria = alertaManual ? 73 : 87;

  String json = "{";
  json += "\"deviceCode\":\"" + String(deviceCode) + "\",";
  json += "\"deviceToken\":\"" + String(deviceToken) + "\",";
  json += "\"latitude\":" + String(lat, 6) + ",";
  json += "\"longitude\":" + String(lng, 6) + ",";
  json += "\"speed\":" + String(velocidade, 1) + ",";
  json += "\"battery\":" + String(bateria);
  json += "}";
  return json;
}

void enviarHTTP(double lat, double lng, bool alertaManual) {
  if (!servidorConfigurado()) {
    ultimoHttpCode = 0;
    ultimoStatusEnvio = "Servidor nao configurado";
    Serial.println("Configure servidor com uma URL terminando em /api/telemetry.");
    return;
  }

  if (!credenciaisConfiguradas()) {
    ultimoHttpCode = 0;
    ultimoStatusEnvio = "Token nao configurado";
    Serial.println("Configure deviceCode e deviceToken iguais aos do trator cadastrado.");
    return;
  }

  conectarWiFi();
  if (WiFi.status() != WL_CONNECTED) {
    ultimoHttpCode = -1;
    ultimoStatusEnvio = "Sem WiFi";
    Serial.println("Nao foi possivel enviar: WiFi offline.");
    return;
  }

  HTTPClient http;
  WiFiClient client;
  WiFiClientSecure secureClient;

  String url = String(servidor);
  bool iniciado = false;

  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    iniciado = http.begin(secureClient, url);
  } else {
    iniciado = http.begin(client, url);
  }

  if (!iniciado) {
    ultimoHttpCode = -2;
    ultimoStatusEnvio = "Erro HTTP begin";
    Serial.println("Erro ao iniciar HTTP.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", deviceToken);

  String json = montarPayload(lat, lng, alertaManual);

  Serial.println();
  Serial.println("Enviando para AgriTrack:");
  Serial.println(json);

  int httpCode = http.POST(json);
  ultimoHttpCode = httpCode;

  Serial.print("HTTP Code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String resposta = http.getString();
    ultimoStatusEnvio = httpCode >= 200 && httpCode < 300 ? "Enviado" : "Rejeitado";
    Serial.println("Resposta do servidor:");
    Serial.println(resposta);
  } else {
    ultimoStatusEnvio = "Erro envio";
    Serial.println("Erro ao enviar HTTP:");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

void imprimirSerial(int ponto, double lat, double lng, double distancia, bool foraDaCerca, bool botaoPressionado) {
  Serial.println();
  Serial.println("==================================");
  Serial.println("AgriTrack - Hardware Simulado");
  Serial.print("Dispositivo: ");
  Serial.println(deviceCode);
  Serial.print("Ponto da rota: ");
  Serial.println(ponto);
  Serial.print("Latitude: ");
  Serial.println(lat, 6);
  Serial.print("Longitude: ");
  Serial.println(lng, 6);
  Serial.print("Distancia do centro: ");
  Serial.print(distancia);
  Serial.println(" metros");
  Serial.print("Status local: ");
  Serial.println(foraDaCerca ? "FORA DA CERCA" : "DENTRO DA CERCA");
  Serial.print("Botao: ");
  Serial.println(botaoPressionado ? "PRESSIONADO" : "solto");
  Serial.print("Ultimo HTTP: ");
  Serial.println(ultimoHttpCode);
  Serial.print("Status envio: ");
  Serial.println(ultimoStatusEnvio);
  Serial.println("==================================");
}

// =======================
// SETUP
// =======================
void setup() {
  Serial.begin(115200);

  pinMode(LED_ALERTA, OUTPUT);
  pinMode(LED_ONLINE, OUTPUT);
  pinMode(BOTAO_TESTE, INPUT_PULLUP);

  digitalWrite(LED_ALERTA, LOW);
  digitalWrite(LED_ONLINE, LOW);

  Wire.begin(OLED_SDA, OLED_SCL);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("Erro ao iniciar OLED.");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("AgriTrack");
    display.println("Iniciando Wokwi...");
    display.display();
  }

  Serial.println("AgriTrack - Simulador ESP32");
  Serial.println("Contrato HTTP: POST /api/telemetry");

  conectarWiFi();
  delay(1000);
}

// =======================
// LOOP
// =======================
void loop() {
  bool botaoPressionado = digitalRead(BOTAO_TESTE) == LOW;

  double latAtual = botaoPressionado ? alertaManualLat : rota[indiceRota][0];
  double lngAtual = botaoPressionado ? alertaManualLng : rota[indiceRota][1];

  double distancia = calcularDistanciaMetros(centroLat, centroLng, latAtual, lngAtual);
  bool foraDaCerca = distancia > raioPermitido;

  digitalWrite(LED_ALERTA, foraDaCerca ? HIGH : LOW);
  mostrarOLED(latAtual, lngAtual, distancia, foraDaCerca, botaoPressionado);

  unsigned long agora = millis();
  if (agora - ultimoEnvio >= intervaloEnvio) {
    ultimoEnvio = agora;

    imprimirSerial(indiceRota + 1, latAtual, lngAtual, distancia, foraDaCerca, botaoPressionado);
    enviarHTTP(latAtual, lngAtual, botaoPressionado);

    if (!botaoPressionado) {
      indiceRota++;
      if (indiceRota >= totalPontos) {
        indiceRota = 0;
      }
    }
  }

  delay(100);
}
