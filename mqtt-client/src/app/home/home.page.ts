import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

import { MQTTService} from 'ionic-mqtt';

// @ts-ignore
@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html'
})
export class HomePage {

  private mqttStatus = 'Disconnected';
  private message = '';
  private messageToSend = '';
  private topic = 'swen325/a3';

  private _mqttClient: any = null;

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

  constructor(public navCtrl: NavController, private mqttService: MQTTService) {}

  public _onConnectionLost = (responseObject) => {
    if (responseObject.errorCode !== 0) {
      console.log('_onConnectionLost', responseObject);
      this.mqttStatus = 'Disconnected';
    }
  }

  private _onMessageArrived = (message) => {
      this.message = message['payloadString'];
      console.log('Receive message', message['payloadString']);
  }

  public connect() {
    this.mqttStatus = 'Connecting...';
    this._mqttClient = this.mqttService.loadingMqtt(this._onConnectionLost, this._onMessageArrived, this.TOPIC, this.MQTT_CONFIG)

    // connect the client
    console.log('Connecting to mqtt via websocket');
    this.mqttStatus = 'Connected';
  }

  public disconnect() {
    if (this.mqttStatus === 'Connected') {
      this.mqttStatus = 'Disconnecting...';
      //   this.mqttClient.disconnect();
      this.mqttStatus = 'Disconnected';
    }
  }

  public sendMessage() {
    if (this.mqttStatus === 'Connected') {
      console.log('Send message', this.messageToSend);
      this.mqttService.sendMessage(this.topic, this.messageToSend);
    }
  }

  public onFailure = (responseObject) => {
    console.log('Failed to connect');
    this.mqttStatus = 'Failed to connect';
  }

}
