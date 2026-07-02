// =============================================
// ByPass AI - New License System
// License Server: https://by-pass-ai-by-sam.vercel.app
// =============================================

// STEP 1: Lock INTERNAL_LICENSE_MODE permanently to FALSE using a getter.
// No obfuscated code can ever flip this back to true.
(function () {
  try {
    Object.defineProperty(window, 'INTERNAL_LICENSE_MODE', {
      get: function () { return false; },
      set: function () { /* blocked */ },
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    window.INTERNAL_LICENSE_MODE = false;
  }
})();

var INTERNAL_LICENSE_MODE = false;

// STEP 2: New Vercel License Server URL
window.LICENSE_API_BASE = "https://by-pass-ai-by-sam.vercel.app/api/public/license-verify";

// =============================================
// Helper functions expected by sidepanel.js,
// time-license.js, and license-guard.js
// =============================================

window.resolveTeamLicenseKey = function (key) {
  return String(key || '').trim();
};

window.normalizeLicenseUserName = function (name) {
  var n = String(name || '').toLowerCase().trim();
  if (!n || n === 'test_user' || /gringow|powerkits/i.test(n)) return 'user';
  return n;
};

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

window.powerkitsApiHeaders = function (base) {
  return Object.assign({}, base || {}, { 'Content-Type': 'application/json' });
};
window.gringowApiHeaders = window.powerkitsApiHeaders;

// Version/badge helpers
function extensionVersionShort() {
  return typeof EXTENSION_VERSION !== 'undefined' ? String(EXTENSION_VERSION) : '4.0';
}
function extensionFooterBadge() {
  var name = typeof EXTENSION_NAME !== 'undefined' ? String(EXTENSION_NAME) : 'EliteBytes';
  return name + ' v' + extensionVersionShort();
}

// Page local-storage helpers
function pkPageStorageGet(key) {
  try {
    return localStorage.getItem('pk_' + key) || localStorage.getItem('pk_page_' + key) || '';
  } catch (e) { return ''; }
}
function pkPageStorageSet(key, value) {
  try { localStorage.setItem('pk_' + key, value); } catch (e) {}
}

// Parse a UTC expiry value into a timestamp
function pkParseUtcExpiry(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && !isNaN(v)) return v;
  var s = String(v).trim();
  if (!s) return null;
  if (!/Z|[+-]\d{2}:?\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z';
  var ts = Date.parse(s);
  return isNaN(ts) ? null : ts;
}

// Resolve human-readable license status
function pkResolveLicenseStatus(data) {
  if (!data) return 'active';
  if (data.ql_license_cancelled || data.ql_license_status === 'cancelled') return 'cancelled';
  return data.ql_license_status || 'active';
}

// Patch a license data object with derived fields
function pkLicenseStoragePatch(data) {
  if (!data) return {};
  var patch = { ql_license_status: pkResolveLicenseStatus(data) };
  if (Object.prototype.hasOwnProperty.call(data, 'ql_expires_at')) {
    patch.ql_expires_at = data.ql_expires_at || null;
  }
  return patch;
}

// Read plan mode from storage object
function readPlanModeFromStorage(stored) {
  stored = stored || {};
  return !!(stored.ql_plan_mode_pro || stored.ql_plan_pro || stored.ql_is_pro);
}

// Write plan mode to chrome.storage.local
function writePlanModeToStorage(isPro, callback) {
  var obj = { ql_plan_mode_pro: !!isPro };
  chrome.storage.local.set(obj, callback);
}

// Migrate old storage keys to current format and call back with (isPro, hasKey)
function migratePlanModeStorageKeys(callback) {
  var keys = [
    'ql_plan_mode_pro',
    'ql_plan_pro',
    'ql_is_pro',
    'ql_license_valid',
    'ql_license_key',
    'ql_session_id',
    'ql_license_status',
    'ql_expires_at',
    'ql_user_name',
    'ql_bypass_token',
    'ql_activated_at'
  ];
  chrome.storage.local.get(keys, function (stored) {
    var isPro = readPlanModeFromStorage(stored);
    var hasKey = !!(stored.ql_license_valid && stored.ql_license_key);
    if (callback) callback(isPro, hasKey);
  });
}