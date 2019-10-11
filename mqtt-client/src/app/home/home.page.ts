import {Component, ElementRef, ViewChild} from '@angular/core';
import { NavController } from '@ionic/angular';

import { MQTTService} from 'ionic-mqtt';
import { Chart } from 'chart.js';
import { interval, Subscription } from 'rxjs';

// @ts-ignore
@Component({
    selector: 'page-home',
    templateUrl: 'home.page.html'
})
export class HomePage {

    private mqttStatus = 'Disconnected';
    private message = 'N/A';
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

    private lastLocation = 'Unknown';
    private lastLocationTime = '';
    private timeSinceUpdate = 0;

    private subscription: Subscription;

    constructor(public navCtrl: NavController, private mqttService: MQTTService) {}

    ngOnInit() {
        this.connect();
        const source = interval(10000);
        const text = 'Your Text Here';
        this.subscription = source.subscribe(val => {
            var startDate = new Date(this.lastLocationTime);
            var endDate   = new Date();
            var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            let minutes = seconds / 60;
            this.timeSinceUpdate = Math.round( minutes * 10) / 10;
        });
    }

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

        // If a move is detected, update the page
        if (detected == '1') {
            if (room === 'living') index = 0;
            else if (room === 'kitchen') index = 1;
            else if (room === 'dining') index = 2;
            else if (room === 'toilet') index = 3;
            else if (room === 'bedroom') index = 4;

            this.updateGraph(index); // Update room occupancy graph

            this.lastLocation = room.charAt(0).toUpperCase() + room.substring(1);
            this.lastLocationTime = splitMessage[0];
            this.timeSinceUpdate = 0;
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
