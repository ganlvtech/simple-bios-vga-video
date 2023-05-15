const canvas = document.createElement('canvas');
document.body.prepend(canvas);
canvas.style.position = 'fixed';
canvas.style.border = '2px solid red';
canvas.style.zIndex = 10000;
canvas.width = 320;
canvas.height = 200;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const video = document.querySelector('video');

const blobParts = [];

const mbr = new Uint8ClampedArray(512);
`B4 00
B0 13
CD 10


BE 00 00
8E DE
BE 80 7C
B4 42
B2 80
CD 13

BE E0 07
8E DE
BE 00 00
BF 00 A0
8E C7
BF 00 00
B9 00 FA
F3
A4

A0 00 00
84 C0
74 15

FB
F4
BB 00 00
8E DB
66 A1 88 7C
66 83 C0 7D
66 A3 88 7C

EB C1


F4
EB FD`.split(/\s+/).forEach((x, i) => {
    mbr[i] = parseInt(x, 16);
});

`10 00 7d 00 00 7e 00 00 01 00 00 00 00 00 00 00`.split(/\s+/).forEach((x, i) => {
    mbr[0x80 + i] = parseInt(x, 16);
});

mbr[0x1fe] = 0x55;
mbr[0x1ff] = 0xaa;
blobParts.push(mbr);

let prevFrameIndex = null;
const timerId = setInterval(() => {
    const frameIndex = Math.floor(video.currentTime * 18.2065);
    if (frameIndex !== prevFrameIndex) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const frameVGABytes = imageData.data.filter((_, i) => i % 4 === 0).map(x => 16 + Math.floor(x / 256 * 16));
        blobParts.push(frameVGABytes);
        prevFrameIndex = frameIndex;
    }
    if (blobParts.length > 182) {
        clearInterval(timerId);
        blobParts[blobParts.length - 1][0] = 0;
    }
}, 16);