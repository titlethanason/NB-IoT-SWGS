#include "AIS_NB_BC95.h"

String apnName = "devkit.nb";

String serverIP = "35.225.63.230"; // Your Server IP
String serverPort = "4000"; // Your Server Port

String udpData = "{\"name\":\"title\",\"sm\":30}";

AIS_NB_BC95 AISnb;

const long interval = 20000;  //millisecond
unsigned long previousMillis = 0;

String now = "off" ;
unsigned long until = 0;

long cnt = 0;
void setup()
{ 
  pinMode(A5,OUTPUT);
  AISnb.debug = true;
  
  Serial.begin(9600);
 
  AISnb.setupDevice(serverPort);

  String ip1 = AISnb.getDeviceIP();  
  delay(1000);
  
  pingRESP pingR = AISnb.pingIP(serverIP);
  previousMillis = millis();

}
void loop()
{ 
  if(millis() > until){
      now = "off";
  }
  if(now == "on")
      digitalWrite(A5,HIGH);
  else
      digitalWrite(A5,LOW);
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval)
  {   
      cnt++;     
      // Send data in String 
      UDPSend udp = AISnb.sendUDPmsgStr(serverIP, serverPort, udpData);
      previousMillis = currentMillis;
  }
  UDPReceive resp = AISnb.waitResponse();
  int count = 0;
  String command;
  String timeString; 
  String rec_data = AISnb.toString(resp.data);
  if(rec_data != ""){
    char buff[50];
    rec_data.toCharArray(buff,50);
    Serial.println("data is : "+rec_data);
    char * pch;
    pch = strtok (buff,",");
    while (pch != NULL)
    {
      if(count == 0){
        command = pch;
        count++;
      }
      else{
        timeString = pch;
      }
      pch = strtok (NULL, ",");
    }
    Serial.println(command+" : "+timeString);
    long timeMillis = timeString.toInt();
    if(command == "on"){
      if(now != "on"){
        Serial.println("now is : "+now);
        now = "on";
        until = millis()+timeMillis; 
        Serial.println("now is : "+now);
      }
    }
    else if(command == "off"){
      if(now != "off"){
        now = "off";
      }
    }
    Serial.print("millis: ");
    Serial.print(millis());
    Serial.print(", until: "); 
    Serial.println(until);
  } 
}


