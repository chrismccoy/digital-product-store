/**
 * Small rendered HTML fragments shared between controllers.
 */

function noFileDownloadPage(name, message, backHref = "/", backText = "Return") {
  return (
    `<!doctype html><meta charset="utf-8"><title>${name}</title>` +
    `<div style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;text-align:center;line-height:1.6">` +
    `<h1 style="font-size:1.25rem">${name}</h1><p>${message}</p>` +
    `<p><a href="${backHref}">${backText}</a></p></div>`
  );
}

module.exports = { noFileDownloadPage };
