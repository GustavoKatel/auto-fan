#include <Thermistor.h>

#define LED_RED 2
#define LED_GREEN 3
#define RELE_PIN 4
#define BUT_PIN 5

Thermistor temp(0);

bool fun_state = false;
float temperature = 0;

int incoming_byte = 0;

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(RELE_PIN, OUTPUT);

  pinMode(BUT_PIN, INPUT);

  Serial.begin(9600);
}

void loop() {

  if(digitalRead(BUT_PIN) == HIGH) {
    fun_state = !fun_state;
  }

  temperature = temp.getTemp();

  if(fun_state == true) {

    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(RELE_PIN, HIGH);
  
  } else {

    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(RELE_PIN, LOW);
    
  }
  
  if(Serial.available() > 0) {
    incoming_byte = Serial.read();
//    Serial.println(incoming_byte);

    switch(incoming_byte) {
      case '1':
        fun_state = true;
        break;
      case '2':
        fun_state = false;
        break;
      case '3':
        Serial.print("t:");
        Serial.print(temperature);
        Serial.print('\n');
        break;
      case '4':
        Serial.print("s:");
        Serial.print(fun_state);
        Serial.print('\n');
        break;
      case 0x00:
      default:
        break;
    }
    
  }

  delay(125);

}
