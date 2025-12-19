#! /usr/bin/env bun

import { createCanvas, registerFont } from 'canvas';
import { type Declaration, parse as parseCss } from 'css';
import { existsSync } from 'node:fs';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = await yargs(hideBin(process.argv))
    .options({
        css: { type: 'string', describe: 'The CSS file to load icon names from', demandOption: true },
        ttf: { type: 'string', describe: 'The TTF file to load icons from', demandOption: true },
        outdir: { type: 'string', describe: 'The directory to output the file in', demandOption: true },
        icon: { type: 'string', describe: 'The icon to render', demandOption: true },
        size: { type: 'number', describe: 'The icon size to render', default: 250 },
    })
    .version(false)
    .parse();

const cssFile = Bun.file(argv.css);

let cssContent: string;

try {
    cssContent = await cssFile.text();
} catch {
    console.error('Nonexistent CSS file provided!');

    process.exit(1);
}

if (!(await Bun.file(argv.ttf).exists())) {
    console.error('Nonexistent TTF file provided!');

    process.exit(1);
}

if (!existsSync(argv.outdir)) {
    console.error('Nonexistent output directory provided!');

    process.exit(1);
}

const parsedCss = parseCss(cssContent);

let foundIconCode: string | undefined;

for (const rule of parsedCss.stylesheet!.rules) {
    if (rule.type !== 'rule') continue;

    const hasIconCode = rule.selectors?.includes(`.fa-${argv.icon}`);

    if (!hasIconCode) continue;

    const iconCode = rule.declarations?.find((declaration) => declaration.type === 'declaration' && declaration.property === '--fa') as
        | Declaration
        | undefined;

    if (iconCode) {
        foundIconCode = iconCode
            .value!.replaceAll(/^"|"$/g, '')
            .replaceAll(/\\([\dA-Fa-f]{1,6})\s?/g, (fullMatch: string, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)));

        break;
    }
}

if (!foundIconCode) {
    console.error('Nonexistent icon provided!');

    process.exit(1);
}

registerFont(argv.ttf, { family: 'Font Awesome' });

const iconSize = argv.size;

const canvas = createCanvas(iconSize, iconSize);
const context = canvas.getContext('2d');

context.font = `${iconSize}px "Font Awesome"`;
context.textAlign = 'left';
context.textBaseline = 'alphabetic';

const foundIconCodeString = foundIconCode.startsWith('\\') ? foundIconCode.slice(1) : foundIconCode;

const metrics = context.measureText(foundIconCodeString);

const glyphWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
const glyphHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

const scale = iconSize / Math.max(glyphWidth, glyphHeight);

context.setTransform(scale, 0, 0, scale, 0, 0);

const x = (iconSize / scale - glyphWidth) / 2 + metrics.actualBoundingBoxLeft;

const y = (iconSize / scale - glyphHeight) / 2 + metrics.actualBoundingBoxAscent;

context.fillText(foundIconCodeString, x, y);

const pngBuffer = canvas.toBuffer();

const outputFile = Bun.file(path.join(argv.outdir, `${argv.icon}.png`));

void outputFile.write(pngBuffer);
