/**
 * Helper log method
 * No external dependencies
 */

export const log = (...msg: unknown[]) => {
  const el = document.getElementById('log');
  const dt = new Date();
  const ts = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}.${dt.getMilliseconds().toString().padStart(3, '0')}`;
  if (el) {
    el.innerText += msg.join(' ') + '\n';
    el.scrollTop = el.scrollHeight;
  }
  // eslint-disable-next-line no-console
  console.log(ts, ...msg);
};
