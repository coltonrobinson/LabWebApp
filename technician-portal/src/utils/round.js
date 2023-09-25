const round = (float) => {
    let number = Number((Math.abs(float) * 100).toPrecision(12));
    return Math.round(number) / 100 * Math.sign(float);
  }

  export default round;