import process from 'node:process';

// Moves the docs server's clock to ZEN_TEST_NOW, still running, so what it renders for today is
// what the browser (at the same time, via page.clock) hydrates.
const offset = Date.parse(process.env.ZEN_TEST_NOW) - Date.now();
const RealDate = Date;
globalThis.Date = class extends RealDate {
    constructor(...args) {
        super(...(args.length ? args : [RealDate.now() + offset]));
    }
    static now() {
        return RealDate.now() + offset;
    }
};
