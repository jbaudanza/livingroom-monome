require("dotenv").config();

import serialosc from "serialosc";
import font from "./4x6_pixel_font.json"
import { getNextBus } from "./nextBus";

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

const processes: { [deviceId: string]: Function } = {};

function runCounter(device: any) {
  // Counter app
  let i = 0;

  function draw() {
    const screen = initArray(8, 8);
    drawDigits(screen, 0, 0, i);
    device.map(0, 0, flip(screen));
  }

  const interval = setInterval(() => {
    i = (i + 1) % 20;
    draw();
  }, 1000);

  draw();

  return () => clearInterval(interval);
}

function runNextBus(device: any) {
  device.all(1);

  async function updateScreen() {
    try {
      const seconds = await getNextBus();
      const minutes = Math.floor(seconds / 60);
      const screen = initArray(8, 8);
      drawDigits(screen, 0, 0, minutes);
      device.map(0, 0, flip(screen));
    } catch (e) {
      console.error(e);

      const screen = [
        [1, 0, 0, 0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 1],
      ];
      device.map(0, 0, screen);
    }
  }

  updateScreen();
  const interval = setInterval(updateScreen, 30000);

  return () => clearInterval(interval);
}

function withOnOff(device: any, next: (device: any) => Function) {
  let cleanup: Function | null = next(device);

  function turnOff() {
    if (cleanup) {
      cleanup();
      cleanup = null;
      device.all(0);
    }
  }

  const autoOffTimeout = setTimeout(() => {
    console.log("turning off after timeout");
    turnOff();
  }, 60 * 60 * 1000);

  function onKey(press: { x: number, y: number, s: number }) {
    console.log("key", press);
    // 1 = down, 0 = up
    if (press.s === 0) {
      return;
    }
    if (cleanup) {
      console.log("turning off");
      turnOff();
    } else {
      console.log("turning on");
      cleanup = next(device);
    }
  }

  device.on('key', onKey);

  return () => {
    clearTimeout(autoOffTimeout);
    device.off('key', onKey);
    turnOff();
  }
}

serialosc.start();
serialosc.on('device:add', (device: any) => {
  console.log("Device added:", device.id);

  processes[device.id] = withOnOff(device, runNextBus);
});

serialosc.on('device:remove', (device: any) => {
  console.log("Device removed:", device.id);
  const p = processes[device.id];
  if (p) {
    p();
    delete processes[device.id];
  }
});

function flip(screen: number[][]) {
  return screen.map(row => row.reverse()).reverse();
}

function drawDigits(screen: number[][], xOffset: number, yOffset: number, i: number) {
  if (i < 10) {
    drawNumber(screen, 2, 1, String(i) as Digit);
  } else {
    const digit1 = String(i)[0] as Digit;
    const digit2 = String(i)[1] as Digit;

    if (digit1 === "1") {
      drawNumber(screen, -1 + xOffset, 1 + yOffset, digit1);
    } else {
      drawNumber(screen, 0 + xOffset, 1 + yOffset, digit1);
    }
    drawNumber(screen, 4 + xOffset, 1 + yOffset, digit2);
  }
}

function initArray(width: number, height: number) {
  return Array(width).fill(0).map(() => Array(height).fill(0))
}

function getWindow(array: number[][], offset: number[], size: number[]) {
  const [rowOffset, colOffset] = offset;
  const [numRows, numCols] = size;

  return array.slice(rowOffset, rowOffset + numRows)
    .map(row => row.slice(colOffset, colOffset + numCols));
}

function drawNumber(screen: number[][], xOffset: number, yOffset: number, digit: Digit) {
  if (digit == null) {
    return;
  }
  const char = font[digit];

  for (let y of [0, 1, 2, 3, 4, 5]) {
    for (let x of [0, 1, 2, 3]) {
      const s = char[y][x] === "#" ? 1 : 0;
      screen[y + yOffset][x + xOffset] = s;
    }
  }
}
