module.exports = function (options, webpack) {
  return {
    ...options,
    externals: {
      bcrypt: 'commonjs bcrypt',
    },
  };
};
