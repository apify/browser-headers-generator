const axios = require('axios');
const defaultLog = require('apify-shared/log');

const USER_AGENT_KV_STORE_RECORD_URL = 'https://api.apify.com/v2/key-value-stores/z1V7YjyftOYIqNsww/records/USER-AGENTS?disableRedirect=true';

class UserAgents {
    constructor(options = {}) {
        const {
            operatingSystems,
            browsers,
            minTimesSeen = 0,
            userAgentsKvStoreRecordUrl = USER_AGENT_KV_STORE_RECORD_URL,
            log = defaultLog.child({ prefix: 'UserAgents' }),
        } = options;

        this.userAgentsKvStoreRecordUrl = userAgentsKvStoreRecordUrl;

        this.minTimeSeen = minTimesSeen;
        this.operatingSystemRegex = operatingSystems.length && new RegExp(operatingSystems.join('|'));
        this.softwareNameCodeRegex = browsers.length && new RegExp(browsers.join('|'));

        this.userAgents = null;
        this.usedUserAgents = new Set();

        this.log = log;
    }

    async initialize() {
        this.log.info(`Fetching user-agents from KeyValueStoreRecord: ${this.userAgentsKvStoreRecordUrl}`);

        const { data } = await axios.get(this.userAgentsKvStoreRecordUrl);

        this.userAgents = data.filter((ua) => this._isMatch(ua));

        this.log.info(`Fetched: ${this.userAgents.length} user agents`);
    }

    async getRandomUserAgent() {
        const userAgent = this._pickRandomElementArray(this.userAgents);

        if (this.usedUserAgents.has(userAgent)) {
            this.log.warning('UserAgent already picked', { userAgent });
        }

        this.usedUserAgents.add(userAgent);

        return userAgent;
    }

    _pickRandomElementArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    _isMatch(userAgent) {
        const {
            softwareNameCode,
            operatingSystemCode,
            timeSeen,
        } = userAgent;

        const isCorrectOs = this.operatingSystemRegex.test(operatingSystemCode);
        const isCorrectBrowser = this.softwareNameCodeRegex.test(softwareNameCode);

        return isCorrectBrowser && isCorrectOs && timeSeen >= this.minTimeSeen;
    }
}

module.exports = UserAgents;
