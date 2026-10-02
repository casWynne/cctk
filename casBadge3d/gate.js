/* =====================================================================
   CasBadge3D — pass-code gate (loader)
   ---------------------------------------------------------------------
   Locks the whole tool on load. The badge/medal engine ships ONLY as the
   encrypted blob in app.enc.js (window.__CB_LOCK). There is no copy of the
   rendering or export code in the page until a correct staff code decrypts
   it here — so with the wrong code there is nothing to preview, screenshot
   or export. Wrong code = decryption fails = nothing runs.

   This file is public and safe to read; it contains no secret. The secret
   is the pass code, which lives only in the staff member's head.

   Crypto parameters MUST match _src/lock-build.mjs.
   ===================================================================== */
(function () {
  "use strict";

  var ITER = 250000, HASH = "SHA-256";

  function b64ToBytes(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // ---- lock screen UI --------------------------------------------------
  var ACCENT = "#4f46b8", GOLD = "#c9a227", INK = "#1c2330";
  var overlay = document.createElement("div");
  overlay.id = "cb-lock";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Staff pass code required");
  overlay.style.cssText = [
    "position:fixed", "inset:0", "z-index:2147483647",
    "display:flex", "align-items:center", "justify-content:center",
    "background:radial-gradient(1200px 600px at 50% -10%, #20264a 0%, #0f1222 60%, #0b0e1a 100%)",
    "font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    "padding:24px", "box-sizing:border-box"
  ].join(";");

  overlay.innerHTML =
    '<div style="width:100%;max-width:400px;background:#fff;border-radius:16px;' +
      'box-shadow:0 10px 40px rgba(0,0,0,.45);padding:28px 26px;box-sizing:border-box;text-align:center">' +
      '<div style="width:52px;height:52px;margin:0 auto 14px;border-radius:50%;background:' + ACCENT +
        ';display:flex;align-items:center;justify-content:center">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" ' +
          'stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/>' +
          '<path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' +
      '<h2 style="margin:0 0 6px;font-family:Sora,Inter,sans-serif;font-size:20px;color:' + INK + '">Staff access only</h2>' +
      '<p style="margin:0 0 18px;font-size:13.5px;line-height:1.5;color:#5a6478">' +
        'CasBadge3D is restricted to course staff. Enter the staff pass code to unlock the tool.</p>' +
      '<form id="cb-form" autocomplete="off">' +
        '<input id="cb-code" type="password" inputmode="text" autocomplete="off" ' +
          'placeholder="Staff pass code" aria-label="Staff pass code" ' +
          'style="width:100%;box-sizing:border-box;padding:12px 14px;font-size:15px;border:1.5px solid #e2e6ef;' +
          'border-radius:10px;outline:none;color:' + INK + '" />' +
        '<button id="cb-go" type="submit" ' +
          'style="width:100%;margin-top:12px;padding:12px 14px;font-size:15px;font-weight:600;color:#fff;' +
          'background:' + ACCENT + ';border:0;border-radius:10px;cursor:pointer">Unlock</button>' +
      '</form>' +
      '<p id="cb-msg" role="alert" aria-live="polite" style="min-height:18px;margin:12px 0 0;font-size:13px;color:#c0392b"></p>' +
      '<p style="margin:14px 0 0;font-size:11.5px;color:#9aa3b5">Protects awarded course badges from unauthorised copying.</p>' +
    '</div>';

  function mount() {
    document.documentElement.style.overflow = "hidden";
    document.body.appendChild(overlay);
    var input = overlay.querySelector("#cb-code");
    var msg   = overlay.querySelector("#cb-msg");
    var btn   = overlay.querySelector("#cb-go");
    var form  = overlay.querySelector("#cb-form");

    // Secure-context guard: crypto.subtle needs https (or localhost).
    if (!window.isSecureContext || !window.crypto || !crypto.subtle) {
      msg.textContent = "Open this tool via its https web address (file:// isn't supported).";
      input.disabled = btn.disabled = true;
      return;
    }
    if (!window.__CB_LOCK || !window.__CB_LOCK.ct) {
      msg.textContent = "Lock data missing (app.enc.js failed to load).";
      input.disabled = btn.disabled = true;
      return;
    }

    setTimeout(function () { input.focus(); }, 50);

    var busy = false, attempts = 0;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      var code = input.value;
      if (!code) { msg.textContent = "Please enter the pass code."; return; }
      busy = true; btn.disabled = true; btn.textContent = "Checking…"; msg.textContent = "";
      unlock(code).then(function (ok) {
        if (ok) return; // engine launched; overlay removed
        attempts++;
        busy = false; btn.disabled = false; btn.textContent = "Unlock";
        input.value = ""; input.focus();
        // small escalating delay discourages rapid guessing
        var wait = Math.min(attempts * 400, 3000);
        btn.disabled = true;
        msg.textContent = "Incorrect code. Try again.";
        setTimeout(function () { btn.disabled = false; }, wait);
      });
    });
  }

  async function unlock(code) {
    var L = window.__CB_LOCK;
    try {
      var baseKey = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]
      );
      var key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64ToBytes(L.salt), iterations: L.iter || ITER, hash: L.hash || HASH },
        baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
      );
      var buf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64ToBytes(L.iv) }, key, b64ToBytes(L.ct)
      );
      var src = new TextDecoder().decode(buf); // correct code → real engine source
      launch(src);
      return true;
    } catch (err) {
      return false; // wrong code → GCM auth fails and throws
    }
  }

  function launch(src) {
    document.documentElement.style.overflow = "";
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    // Run exactly like the original <script src="app.js"> (global scope).
    var s = document.createElement("script");
    s.textContent = src;
    document.body.appendChild(s);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
