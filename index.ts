#! /usr/bin/env bun

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = await yargs(hideBin(process.argv))
    .options({
        css: { type: 'string', describe: 'The CSS file to load icon names from', demandOption: true },
        ttf: { type: 'string', describe: 'The TTF file to load icons from', demandOption: true },
        outdir: { type: 'string', describe: 'The directory to output the file in', demandOption: true },
        icon: { type: 'string', describe: 'The icon to render', demandOption: true },
    })
    .version(false)
    .parse();

console.log(argv);
