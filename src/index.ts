import serialosc from "serialosc";
import font from "./4x6_pixel_font.json"

// Instructions for oscserial in systemd
// https://forum.bela.io/d/863-monome-grid-osc-bela/6

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

serialosc.start();
serialosc.on('device:add', (device: any) => {
  console.log("Device added:", device.id);

  // Counter app
  let i = 0;
  setInterval(() => {
    console.log("Updating screen: i =", i);
    i = (i + 1) % 20;

    // initialize to all zeros
    const screen = initArray(8, 8);

    drawDigits(screen, 0, 0, i);

    device.map(0, 0, flip(screen));
  }, 1000);

  // Animation app
  /*
    const full = initArray(16,8);
    drawDigits(full, 0, 0, 12);
    drawDigits(full, 0, 8, 34);
  
    let i=0;
    setInterval(() => {
      // XXX: I don't think this getWindow function works
      const screen = getWindow(full, [i,0], [8,8]);
      device.map(0,0, screen);
      i = (i+1)%16;
    }, 1000);
  */

  device.on('key', (press: any) => {
    console.log(press);
  });
});

serialosc.on('device:remove', (device: any) => {
  console.log("Device removed:", device.id);
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
