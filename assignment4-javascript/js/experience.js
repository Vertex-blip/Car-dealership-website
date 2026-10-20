// Muhammad: background-color cycling and a live clock from the Date object.
(() => {
  const colors = [
    { name: 'Warm cream', value: '#f5f0e7' },
    { name: 'Soft sky', value: '#dceaf0' },
    { name: 'Pale sage', value: '#e1eadd' }
  ];
  const changeButton = document.querySelector('#change-background');
  const colorStatus = document.querySelector('#color-status');
  let colorIndex = 0;
  changeButton.addEventListener('click', () => {
    colorIndex = (colorIndex + 1) % colors.length;
    document.body.style.backgroundColor = colors[colorIndex].value;
    colorStatus.textContent = `Current background: ${colors[colorIndex].name}`;
  });

  const clock = document.querySelector('#current-datetime');
  const timezoneLabel = document.querySelector('#timezone-label');
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  });
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  timezoneLabel.textContent = localZone ? `Device time zone: ${localZone}` : 'Time from your device';
  function updateClock() {
    const now = new Date();
    clock.textContent = formatter.format(now);
    clock.dateTime = now.toISOString();
  }
  updateClock();
  setInterval(updateClock, 1000);
})();
