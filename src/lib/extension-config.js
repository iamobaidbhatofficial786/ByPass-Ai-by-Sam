// =============================================
// ByPass AI - New License System
// License Server: https://by-pass-ai-by-sam.vercel.app
// =============================================

// STEP 1: Lock INTERNAL_LICENSE_MODE permanently to FALSE.
// This uses a getter that always returns false and a no-op setter
// so NO obfuscated or external code can ever flip it to true.
(function () {
  var _value = false;
  try {
    Object.defineProperty(window, 'INTERNAL_LICENSE_MODE', {
      get: function () { return _value; },
      set: function () { /* intentionally blocked */ },
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    window.INTERNAL_LICENSE_MODE = false;
  }
})();

// Required for any code that reads this as a local var
var INTERNAL_LICENSE_MODE = false;

// STEP 2: Point the extension to YOUR new Vercel license server
window.LICENSE_API_BASE = "https://by-pass-ai-by-sam.vercel.app/api/public/license-verify";

// STEP 3: Helper functions expected by time-license.js and license-guard.js

window.resolveTeamLicenseKey = function (key) {
  return String(key || '').trim();
};

window.normalizeLicenseUserName = function (name) {
  var n = String(name || '').toLowerCase().trim();
  if (!n || n === 'test_user' || n === 'gringow' || n === 'powerkits') {
    return 'user';
  }
  return n;
};

// Returns a blank/invalid session — forces validation against Vercel API
window.powerkitsInternalSessionStorage = function (sessionId, userName) {
  return {
    ql_license_valid: false,
    ql_license_key: '',
    ql_session_id: sessionId || '',
    ql_user_name: window.normalizeLicenseUserName(userName),
    ql_license_status: 'inactive',
    ql_expires_at: null,
    ql_activated_at: new Date().toISOString()
  };
};

window.gringowInternalSessionStorage = window.powerkitsInternalSessionStorage;

// Headers helper — no extra API keys needed for our public endpoint
window.powerkitsApiHeaders = function (base) {
  return Object.assign({}, base || {}, {
    'Content-Type': 'application/json'
  });
};

window.gringowApiHeaders = window.powerkitsApiHeaders;

// Version badge helper
function extensionVersionShort () {
  return typeof EXTENSION_VERSION !== 'undefined' ? String(EXTENSION_VERSION) : '4.0';
}

function extensionFooterBadge () {
  var name = typeof EXTENSION_NAME !== 'undefined' ? String(EXTENSION_NAME) : 'EliteBytes';
  return name + ' v' + extensionVersionShort();
}

// Storage helpers used by sidepanel
function pkPageStorageGet (key) {
  try {
    return localStorage.getItem('pk_' + key) || localStorage.getItem('pk_page_' + key) || '';
  } catch (e) { return ''; }
}

function pkPageStorageSet (key, value) {
  try {
    localStorage.setItem('pk_' + key, value);
  } catch (e) {}
}