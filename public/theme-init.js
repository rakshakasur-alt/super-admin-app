// Applies the saved theme before first paint (no flash).
// Kept as a file, not inline, so the Content-Security-Policy can use script-src 'self'.
(function() {
  var t = localStorage.getItem('sa-theme');
  if (t === 'dark' || t === 'light') {
    document.documentElement.setAttribute('data-theme', t);
  }
  // else keep default 'dark' set on the html element above
})();
