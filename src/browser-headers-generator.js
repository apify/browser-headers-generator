const defaultLog = require('apify-shared/log');
const ow = require('ow');
const UserAgents = require('./user-agents');

/**
 * Generates browser like headers with real random user agents.
 */
class BrowserHeadersGenerator {
    /**
     *
     * @param options {Object}
     * @param options.operatingSystems {array<string>} You can pass multiple OS - so far only "windows", "linux", "mac" are supported.
     * @param options.browsers {array<string>} - You can pass multiple browsers - so far only "chrome" and "firefox" are supported.
     * @param options.minTimeSeen {number} - Minimum number of times the fetched userAgent was seen on the source website.
     * The higher the number is the more the user agent was used and hence should more likely be real.
     * @param options.userAgentsKvStoreRecordUrl {string}  - key-value store record url to fetch the userAgents from.
     */
    constructor(options = {}) {
        const {
            operatingSystems = ['windows', 'linux', 'mac'],
            browsers = ['chrome', 'firefox'],
            minTimesSeen = 300,
            userAgentsKvStoreRecordUrl,
        } = options;

        this._validate(options);

        this.log = defaultLog.child({ prefix: 'BrowserHeaderGenerator' });

        this.userAgents = new UserAgents({
            operatingSystems,
            browsers,
            minTimesSeen,
            userAgentsKvStoreRecordUrl,
            log: this.log.child({ prefix: 'UserAgents' }),
        });

        this.initialized = false;
    }

    /**
     * Loads the userAgents from the key-value-store.
     * Must be called before any other actions.
     * @return {Promise<void>}
     */
    async initialize() {
        await this.userAgents.initialize();
        this.initialized = true;
    }

    /**
     * Creates a random browser headers structure based on the randomly picked user agent.
     * @return {Promise<{
     * Accept: (string),
     * "User-Agent": *,
     * Referer: *,
     * "Sec-Fetch-Dest": *,
     * "Sec-Fetch-Site": *,
     * "Accept-Encoding": *,
     * Pragma: string,
     * "Sec-Fetch-Mode": *,
     * "Cache-Control": *,
     * "Upgrade-Insecure-Requests": *,
     * "Sec-Gpc": *,
     * "Sec-Fetch-User": *,
     * "Accept-Language": *}>}
     */
    async getRandomizedHeaders() {
        if (!this.initialized) throw new Error('Browser headers generator must be initialized first.');

        const genericStructure = this._getUniversalHeadersStructure();
        const { userAgent, softwareNameCode, softwareVersion } = await this.userAgents.getRandomUserAgent();

        genericStructure['User-Agent'] = userAgent;

        let browserSpecific;
        if (softwareNameCode.includes('chrome')) {
            browserSpecific = this._getChromeSpecificHeaders();
        } else if (softwareNameCode.includes('firefox')) {
            browserSpecific = this._getFirefoxSpecificHeaders(softwareVersion);
        }

        const mergedHeaders = {
            ...genericStructure,
            ...browserSpecific,
            ...this._getRandomHeadersPart(),
        };

        return this._orderHeaders(mergedHeaders);
    }

    _getUniversalHeadersStructure() {
        const structure = {
            'User-Agent': '',
            'Accept-Encoding': 'gzip, deflate, br',
            'Upgrade-Insecure-Requests': 1,
            Pragma: 'no-cache',
            'Cache-Control': 'no-cache',
        };

        return structure;
    }

    _orderHeaders(mergedHeaders) {
        return {
            'User-Agent': mergedHeaders['User-Agent'],
            Accept: mergedHeaders.Accept,
            'Accept-Language': mergedHeaders['Accept-Language'],
            'Accept-Encoding': mergedHeaders['Accept-Encoding'],
            Referer: mergedHeaders.Referer,
            'Upgrade-Insecure-Requests': mergedHeaders['Upgrade-Insecure-Requests'],
            Pragma: mergedHeaders.Pragma,
            'Cache-Control': mergedHeaders['Cache-Control'],
            'Sec-Fetch-Dest': mergedHeaders['Sec-Fetch-Dest'],
            'Sec-Fetch-Mode': mergedHeaders['Sec-Fetch-Mode'],
            'Sec-Fetch-Site': mergedHeaders['Sec-Fetch-Site'],
            'Sec-Fetch-User': mergedHeaders['Sec-Fetch-User'],
            'Sec-Gpc': mergedHeaders['Sec-Gpc'],

        };
    }

    _getRandomHeadersPart() {
        return {
            DNT: this._pickRandomElementArray([1, 0]), // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/DNT
            'Accept-Language': 'en-US;q=0.5,en;q=0.3', // @TODO: Randomize
            Referer: this._pickRandomElementArray([
                'https://google.com', 'http://www.bing.com/',
                'https://yandex.com/', 'https://duckduckgo.com/',
                'https://www.yahoo.com/', 'https://www.baidu.com/',
                'https://contextualwebsearch.com/', 'https://www.yippy.com/',

            ]),

        };
    }

    _getChromeSpecificHeaders() {
        return {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8t',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Gpc': 1,
        };
    }

    _getFirefoxSpecificHeaders(softwareVersion) {
        let Accept;

        if (softwareVersion >= 66) {
            Accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
        } else if (softwareVersion === 65) {
            Accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
        } else {
            Accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
        }

        return {
            Accept,
            TE: 'trailers',
        };
    }

    _pickRandomElementArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    _validate(options) {
        return ow(options, ow.object.exactShape({
            operatingSystems: ow.optional.array.includes(['windows', 'linux', 'mac']),
            browsers: ow.optional.array.includes(['chrome', 'firefox']),
            timeSeen: ow.optional.number,
            userAgentsKvStoreRecordUrl: ow.optional.string,

        }));
    }
}

module.exports = BrowserHeadersGenerator;
