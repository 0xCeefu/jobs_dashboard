export default () => ({
  secret: {
    accessToken: process.env.JWT_SECRET,
    refreshToken: process.env.JWT_REFRESH_SECRET,
  },
});
