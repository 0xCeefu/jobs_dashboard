export default () => ({
  google: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUrl: process.env.GOOGLE_OAUTH_REDIRECT_URL,
  },
});
