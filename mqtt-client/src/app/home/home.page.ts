// import { Component } from '@angular/core';
//
// @Component({
//   selector: 'app-home',
//   templateUrl: 'home.page.html',
//   styleUrls: ['home.page.scss'],
// })
// export class HomePage {
//
//   constructor() {}
//
// }

import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

import { Paho } from '../../assets/js/paho-mqtt';

import { MQTTService } from 'ionic-mqtt';

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html'
})
export class HomePage {

  private mqttStatus = 'Disconnected';
  private mqttClient: any = null;
  private message: any = '';
  private messageToSend = 'Type your message here.';
  private topic = 'swen325/a3';
  private clientId = '342323cwwerwe'; // this string must be unique to every client

  private _mqttClient: any;

  private MQTT_CONFIG: {
    host: string,
    port: number,
    clientId: string,
  } = {
    host: 'barretts.ecs.vuw.ac.nz',
    port: 8883,
    clientId: "/mqtt",
  };

  private TOPIC: string[] = ['swen325/a3'];

  constructor(public navCtrl: NavController, private mqttService: MQTTService) {
  }

  ngOnInit() {
    this._mqttClient = this.mqttService.loadingMqtt(this._onConnectionLost, this._onMessageArrived, this.TOPIC, this.MQTT_CONFIG)
  }

  private _onConnectionLost(responseObject) {
    // connection listener
    // ...do actions when connection lost
    console.log('_onConnectionLost', responseObject);
  }

  private _onMessageArrived(message) {
    // message listener
    // ...do actions with arriving message
    console.log('message', message['payloadString']);
  }

  public connect() {
    this.mqttStatus = 'Connecting...';
    this.mqttClient = new Paho.MQTT.Client('barretts.ecs.vuw.ac.nz', 8883, '342323cwwerwe', this.clientId);

    // set callback handlers
    this.mqttClient.onConnectionLost = this.onConnectionLost;
    this.mqttClient.onMessageArrived = this.onMessageArrived;

    // connect the client
    console.log('Connecting to mqtt via websocket');
    this.mqttClient.connect({timeout: 10, useSSL: false, onSuccess: this.onConnect, onFailure: this.onFailure});
  }

  public disconnect() {
    if (this.mqttStatus === 'Connected') {
      this.mqttStatus = 'Disconnecting...';
      this.mqttClient.disconnect();
      this.mqttStatus = 'Disconnected';
    }
  }

  public sendMessage() {
    if (this.mqttStatus === 'Connected') {
      this.mqttClient.publish(this.topic, this.messageToSend);
    }
  }

  public onConnect = () => {
    console.log('Connected');
    this.mqttStatus = 'Connected';

    // subscribe
    this.mqttClient.subscribe(this.topic);
  }

  public onFailure = (responseObject) => {
    console.log('Failed to connect');
    this.mqttStatus = 'Failed to connect';
  }


  public onConnectionLost = (responseObject) => {
    if (responseObject.errorCode !== 0) {
      this.mqttStatus = 'Disconnected';
    }
  }

  public onMessageArrived = (message) => {
    console.log('Received message');
    this.message = message.payloadString;
  }

}
