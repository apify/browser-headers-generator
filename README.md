# Browser headers generator

This package emulates browser-like headers for Firefox and Chrome browsers.
It picks a random `user-agent` and then adds correct headers to look precisely like a browser.

This package is useful everywhere where a simulation of browser headers is necessary, such as web scraping, testing, web automation.


## Example usage
By default, both `chrome` and `firefox` browsers are used as well as `linux`, `mac`, `windows` operating systems.
 
``` javascript
const BrowserHeadersGenerator = require("browser-headers-generator");

const browserHeadersGenerator = new BrowserHeadersGenerator();
await browserHeadersGenerator.initialize()

const randomBrowserHeaders = await browserHeadersGenerator.getRandomizedHeaders()
```

Get random headers only for Chrome on windows:

``` javascript
const BrowserHeadersGenerator = require("browser-headers-generator");

const browserHeadersGenerator = new BrowserHeadersGenerator({
        operatingSystems: ["windows"],
        browsers: ["chrome"]
});

await browserHeadersGenerator.initialize()

const randomBrowserHeaders = await browserHeadersGenerator.getRandomizedHeaders()
```
