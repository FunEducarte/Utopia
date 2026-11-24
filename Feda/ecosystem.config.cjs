module.exports = {
  apps: [
    {
      name: "utopy-micelio",
      script: "dist/utopy/micelio/micelio.node.js",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 50,
      restart_delay: 1500,
      time: true,
    },
  ],
};
