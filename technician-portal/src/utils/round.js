const round = (float, digits = 2) => {
  let number = Number((Math.abs(float) * 10 ** digits).toPrecision(12));
  return Math.round(number) / 10 ** digits * Math.sign(float);
}

export default round;