import {allocateRooms} from "./markerAllocation.ts";
import emitter from "../common/eventBus.ts";

self.onmessage = (event) => {
    const { markerData, studentData, noOfRooms } = event.data;

    emitter.$on("progress", (message: string) => {
        self.postMessage({type: 'progress', message})
    })

    const allocation = allocateRooms(markerData, studentData, noOfRooms);

    // Send the result back to the main thread
    self.postMessage({ type: 'result', data: allocation });
};
