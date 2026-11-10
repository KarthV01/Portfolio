/* LT6 four-stroke timing. Dimensions here are illustrative drawing units.
   Four shared crankpins, five mains, 180-degree throws, 90-degree banks.
   Cylinder numbers run front to rear: odd left, even right. */
(function (root) {
  const order = [1, 4, 3, 8, 7, 6, 5, 2];
  const radius = 0.4,
    rodLength = 1.5;
  const wrap = (x, period) => ((x % period) + period) % period;
  function cylinder(number, phase) {
    const station = Math.floor((number - 1) / 2);
    const bank = number % 2 ? 1 : -1;
    const angle = (bank * Math.PI) / 4;
    const throwAngle = phase + Math.PI / 4 + [0, Math.PI, Math.PI, 0][station];
    const z = -1.68 + station * 1.12 + bank * 0.11;
    const pin = [
      radius * Math.sin(throwAngle),
      radius * Math.cos(throwAngle),
      z,
    ];
    const delta = throwAngle - angle;
    const height =
      radius * Math.cos(delta) +
      Math.sqrt(rodLength ** 2 - (radius * Math.sin(delta)) ** 2);
    const wrist = [height * Math.sin(angle), height * Math.cos(angle), z];
    const cycle = wrap(
      phase - (order.indexOf(number) * Math.PI) / 2,
      Math.PI * 4,
    );
    return {
      number,
      bank,
      station,
      angle,
      pin,
      wrist,
      cycle,
      firing: cycle < Math.PI / 2,
    };
  }
  const api = { order, radius, rodLength, cylinder, wrap };
  if (typeof module !== "undefined") module.exports = api;
  root.LT6 = api;
})(typeof window !== "undefined" ? window : globalThis);
