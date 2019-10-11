import {Component, ElementRef, ViewChild} from '@angular/core';
import { NavController } from '@ionic/angular';

import { MQTTService} from 'ionic-mqtt';
import { Chart } from 'chart.js';

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

  @ViewChild("barCanvas", {static: false}) barCanvas: ElementRef;
  private barChart: Chart;

  private graphData = [0, 0, 0, 0, 0];

  constructor(public navCtrl: NavController, private mqttService: MQTTService) {}

  ionViewDidEnter() {
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: "bar",
      data: {
        labels: ["Living", "Kitchen", "Dining", "Toilet", "Bedroom"],
        datasets: [
          {
            label: "# of Votes",
            data: this.graphData,
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
            ],
            borderColor: [
              "rgba(255,99,132,1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    });
  }

  public _onConnectionLost = (responseObject) => {
    if (responseObject.errorCode !== 0) {
      console.log('_onConnectionLost', responseObject);
      this.mqttStatus = 'Disconnected';
    }
  }

  private _onMessageArrived = (message) => {
    let splitMessage = message['payloadString'].split(',');
    let index = -1;
    let room = splitMessage[1];
    let detected = splitMessage[2];

    if (detected == '1') {
      if (room === 'living') index = 0;
      else if (room === 'kitchen') index = 1;
      else if (room === 'dining') index = 2;
      else if (room === 'toilet') index = 3;
      else if (room === 'bedroom') index = 4;

      this.updateGraph(index)
    }

    this.message = message['payloadString'];
    console.log('Receive message', message['payloadString']);
  }

  public updateGraph(room) {
    this.barChart.data.datasets[0].data[room]++;
    this.barChart.update();
  }

  public connect = () => {
    this.mqttStatus = 'Connecting...';
    this._mqttClient = this.mqttService.loadingMqtt(this._onConnectionLost, this._onMessageArrived, this.TOPIC, this.MQTT_CONFIG)

    // connect the client
    console.log('Connecting to mqtt via websocket');
    this.mqttStatus = 'Connected';
  }

  public disconnect() {
    if (this.mqttStatus === 'Connected') {
      this.mqttStatus = 'Disconnecting...';
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
