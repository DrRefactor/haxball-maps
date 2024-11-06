import puppeteer from "puppeteer";
import { buildSync } from "esbuild";

const compiledBot = buildSync({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "browser",
  format: "iife",
  write: false,
}).outputFiles[0].text;

const browser = await puppeteer.launch({
  headless: false,
});
const page = await browser.newPage();
await page.goto("https://www.haxball.com/headless");

// HBInit is initialized in deferred script, let's wait for it
await page.waitForFunction(() => "HBInit" in window);

await page.addScriptTag({
  content: compiledBot,
});