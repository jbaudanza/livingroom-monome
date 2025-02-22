const serialosc = require('serialosc');
const font = require("./4x6_pixel_font.json");

serialosc.start();
serialosc.on('device:add', (device) => {

  let i = 0;
  setInterval(() => {
    i = (i + 1) % 20;

    // initialize to all zeros
    const screen = Array(8).fill(0).map(() => Array(8).fill(0))

    if (i < 10) {
      drawNumber(screen, 2, 1, i);
    } else {
      const digit1 = String(i)[0];
      const digit2 = String(i)[1];

      if (digit1 === "1") {
        drawNumber(screen, -1, 1, digit1);
      } else {
        drawNumber(screen, 0, 1, digit1);
      }
      drawNumber(screen, 4, 1, digit2);
    }

    device.map(0,0,screen);
  }, 1000);

  device.on('key', (press) => {
    console.log(press);
  });
});

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
