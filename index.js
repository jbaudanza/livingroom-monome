const serialosc = require('serialosc');
const font = require("./4x6_pixel_font.json");

serialosc.start();
serialosc.on('device:add', (device) => {

// Counter app
  let i = 0;
  setInterval(() => {
    i = (i + 1) % 20;

    // initialize to all zeros
    const screen = initArray(8,8);

    drawDigits(screen, 0, 0, i);

    device.map(0,0,screen);
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

  device.on('key', (press) => {
    console.log(press);
  });
});

function drawDigits(screen, xOffset, yOffset,  i) {
    if (i < 10) {
      drawNumber(screen, 2, 1, i);
    } else {
      const digit1 = String(i)[0];
      const digit2 = String(i)[1];

      if (digit1 === "1") {
        drawNumber(screen, -1 + xOffset, 1 + yOffset, digit1);
      } else {
        drawNumber(screen, 0 + xOffset, 1 + yOffset, digit1);
      }
      drawNumber(screen, 4 + xOffset, 1 + yOffset, digit2);
    }
}

function initArray(width, height) {
  return Array(width).fill(0).map(() => Array(height).fill(0))
}

function getWindow(array, offset, size) {
    const [rowOffset, colOffset] = offset;
    const [numRows, numCols] = size;
    
    return array.slice(rowOffset, rowOffset + numRows)
        .map(row => row.slice(colOffset, colOffset + numCols));
}

function drawNumber(screen, xOffset, yOffset, digit) {
  if (digit == null) {
    return;
  }
  const char = font[String(digit)];

  for (let y of [0,1,2,3,4,5]) {
    for (let x of [0,1,2,3]) {
      const s= char[y][x] === "#" ? 1 : 0;
      screen[y + yOffset][x + xOffset] = s;
    }
  }
}
