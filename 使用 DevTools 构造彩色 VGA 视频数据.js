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

// key = r * 64 + g * 8 + b
const HUE_MAP = {
    4: 0,
    68: 1,
    132: 2,
    196: 3,
    260: 4,
    259: 5,
    258: 6,
    257: 7,
    256: 8,
    264: 9,
    272: 10,
    280: 11,
    288: 12,
    224: 13,
    160: 14,
    96: 15,
    32: 16,
    33: 17,
    34: 18,
    35: 19,
    36: 20,
    28: 21,
    20: 22,
    12: 23,
};
const rgbToVga256 = (r, g, b) => {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    if (delta <= 10) { // 16 ~ 31 灰色
        return 16 + Math.floor((r + g * 2 + b) / 4 / 256 * 16);
    } else if (delta >= 224) {
        return 32 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
    } else if (delta >= 144) {
        if (min >= 85) {
            return 8 + Math.floor((r - min) / delta * 2 + 0.5) * 4 + Math.floor((g - min) / delta * 2 + 0.5) * 2 + Math.floor((b - min) / delta * 2 + 0.5);
        } else {
            return 0 + Math.floor((r - min) / delta * 2 + 0.5) * 4 + Math.floor((g - min) / delta * 2 + 0.5) * 2 + Math.floor((b - min) / delta * 2 + 0.5);
        }
    } else if (delta >= 91) {
        if (min >= 113) {
            return 56 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        } else {
            return 104 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        }
    } else if (delta > 40) {
        if (min >= 149) {
            return 80 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        } else if (min >= 57) {
            return 128 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        } else {
            return 176 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        }
    } else {
        if (min >= 113) {
            return 16 + Math.floor((r + g * 2 + b) / 4 / 256 * 16); // 灰色
        } else if (min >= 81) {
            return 152 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        } else if (min >= 65) {
            return 16 + Math.floor((r + g * 2 + b) / 4 / 256 * 16); // 灰色
        } else if (min >= 45) {
            return 224 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        } else if (min >= 32) {
            return 200 + HUE_MAP[Math.floor((r - min) / delta * 4 + 0.5) * 64 + Math.floor((g - min) / delta * 4 + 0.5) * 8 + Math.floor((b - min) / delta * 4 + 0.5)];
        } else {
            return 16 + Math.floor((r + g * 2 + b) / 4 / 256 * 16); // 灰色
        }
    }
}

let prevFrameIndex = null;
const timerId = setInterval(() => {
    const frameIndex = Math.floor(video.currentTime * 18.2065);
    if (frameIndex !== prevFrameIndex) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const frameVGABytes = new Uint8ClampedArray(imageData.data.length / 4);
        let j = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            frameVGABytes[j] = rgbToVga256(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
            j++;
        }
        blobParts.push(frameVGABytes);
        prevFrameIndex = frameIndex;
    }
    if (blobParts.length > 182) {
        clearInterval(timerId);
        blobParts[blobParts.length - 1][0] = 0;
    }
}, 16);