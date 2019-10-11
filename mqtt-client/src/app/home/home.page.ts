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
    private mqttClient: any = null;
    private messageToSend = '';
    private topic = 'swen325/a3';

    private lastLocation = 'Unknown';
    private lastLocationTime = '';
    private timeSinceUpdate = 0;

    private mqttTopic: string[] = ['swen325/a3'];

    @ViewChild("barCanvas", {static: false}) barCanvas: ElementRef;
    private barChart: Chart;

    private subscription: Subscription;

    private MQTT_CONFIG: {
        host: string,
        port: number,
        clientId: string,
    } = {
        host: 'barretts.ecs.vuw.ac.nz',
        port: 8883,
        clientId: "/mqtt",
    };


    constructor(public navCtrl: NavController, private mqttService: MQTTService) {}

    ngOnInit() {
        this.connect(); // Connect MQTT client

        // Update the time since last known location update every 10 seconds
        const source = interval(10000);
        this.subscription = source.subscribe(val => {
            let startDate = new Date(this.lastLocationTime);
            let endDate   = new Date();
            let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            let minutes = seconds / 60;
            this.timeSinceUpdate = Math.round( minutes * 10) / 10;
        });
    }

    ionViewDidEnter() {
        this.createGraph();
    }


    /* ###### Room occupancy functions ##### */

    public createGraph() {
        this.barChart = new Chart(this.barCanvas.nativeElement, {
            type: "bar",
            data: {
                labels: ["Living", "Kitchen", "Dining", "Toilet", "Bedroom"],
                datasets: [
                    {
                        label: "# of Votes",
                        data: [0, 0, 0, 0, 0],
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

    public updateGraph(index) {
        this.barChart.data.datasets[0].data[index]++;
        this.barChart.update();
    }


    /* ###### MQTT Broker functions ##### */

    public connect = () => {
        this.mqttStatus = 'Connecting...';

        // Connect the client
        this.mqttClient = this.mqttService.loadingMqtt(
            this._onConnectionLost,
            this._onMessageArrived,
            this.mqttTopic,
            this.MQTT_CONFIG
        );

        this.mqttStatus = 'Connected';
    }

    public _onConnectionLost = (responseObject) => {
        if (responseObject.errorCode !== 0) {
            console.log('_onConnectionLost', responseObject);
            this.mqttStatus = 'Disconnected';
        }
    }

    private _onMessageArrived = (message) => {
        let splitMessage = message['payloadString'].split(',');
        let room = splitMessage[1];
        let detected = splitMessage[2];

        // If a move is detected, update the page
        if (detected == '1') {
            let index = -1;

            // Find the graph data index for the room
            if (room === 'living') index = 0;
            else if (room === 'kitchen') index = 1;
            else if (room === 'dining') index = 2;
            else if (room === 'toilet') index = 3;
            else if (room === 'bedroom') index = 4;

            this.updateGraph(index); // Update room occupancy graph

            // Update last known location
            this.lastLocation = room.charAt(0).toUpperCase() + room.substring(1);
            this.lastLocationTime = splitMessage[0];
            this.timeSinceUpdate = 0;
        }

        console.log('Receive message', message['payloadString']);
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
