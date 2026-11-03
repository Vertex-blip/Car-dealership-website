/* The required CDN is tried first. The identical local build keeps the ZIP usable offline. */
if (!window.jQuery) {
  document.write('<script src="vendor/jquery-4.0.0.min.js"><\/script>');
}
