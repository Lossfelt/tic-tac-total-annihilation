// jsdom har ikke avspilling av lyd. Stubben hindrer "Not implemented" i
// testutdata. Tester som vil sjekke lyd mocker ./sound.js i stedet.
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
}
