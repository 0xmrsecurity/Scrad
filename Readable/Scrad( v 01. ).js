javascript:(function () {
  const endpointRe =
    /(?:^|["'`])((?:\/|https?:\/\/|\/\/)[^"'`\s<>]{2,})/g;

  const jsRe =
    /(?:^|["'`])((?:\/|https?:\/\/|\/\/)[^"'`\s<>]+\.js(?:\?[^"'`]*)?)/g;

  const endpoints = new Set();
  const jsFiles = new Set();

  function collect(text) {
    if (!text) return;

    for (const match of text.matchAll(endpointRe)) {
      const url = match[1];
      if (url.length > 2) endpoints.add(url);
    }

    for (const match of text.matchAll(jsRe)) {
      jsFiles.add(match[1]);
    }
  }

  document.querySelectorAll("script").forEach(script => {
    if (script.src) {
      jsFiles.add(script.src);
      fetch(script.src)
        .then(r => r.text())
        .then(t => collect(t))
        .catch(() => {});
    } else {
      collect(script.textContent);
    }
  });

  collect(document.documentElement.outerHTML);

  setTimeout(() => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #0d0d0d;
      color: #00ff41;
      font-family: monospace;
      z-index: 99999;
      padding: 30px;
      overflow: auto;
    `;

    const normalized = [...endpoints]
      .map(u => {
        try {
          return u.startsWith("http")
            ? u
            : new URL(u, location.origin).href;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort();

    const groups = {};

    normalized.forEach(urlStr => {
      let group = "misc";

      try {
        const url = new URL(urlStr);

        if (url.hostname === location.hostname) {
          const segment = url.pathname.split("/")[1] || "root";
          group = /^[a-zA-Z0-9_-]{3,}$/.test(segment)
            ? segment
            : "misc";
        } else {
          group = "external";
        }
      } catch {}

      (groups[group] ||= []).push(urlStr);
    });

    let html = `
      <div style="text-align:center;margin-bottom:25px;">
        <h1 style="margin:0;font-size:48px;color:#8B0000;letter-spacing:2px;">
          Scrad
        </h1>
        <div style="margin-top:8px;font-size:14px;color:#ccc;">
          About this: This tool finds hidden endpoints across the entire website.
        </div>
      </div>

      <h3 style="
        color:#fff;
        border-bottom:2px solid #00ff41;
        padding-bottom:10px;
      ">
        Discovered Endpoints (${normalized.length})
      </h3>
    `;

    Object.keys(groups)
      .sort()
      .forEach(group => {
        html += `
          <div style="margin-bottom:25px;">
            <div style="
              color:#ffcc00;
              font-weight:bold;
              font-size:1.1em;
              border-left:4px solid #ffcc00;
              padding-left:10px;
              margin-bottom:8px;
            ">
              /${group.toUpperCase()}
            </div>
        `;

        groups[group].forEach(url => {
          html += `
            <div style="margin-left:20px;">
              <a
                href="${url}"
                target="_blank"
                style="color:#00ff41;text-decoration:none;word-break:break-all;"
              >
                ${url}
              </a>
            </div>
          `;
        });

        html += `</div>`;
      });

    overlay.innerHTML = html;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "CLOSE [X]";
    closeBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #5A0000;
      color: #fff;
      border: none;
      padding: 10px 20px;
      font-weight: bold;
      cursor: pointer;
    `;

    closeBtn.onclick = () => overlay.remove();

    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
  }, 3000);
})();
