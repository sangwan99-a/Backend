module.exports = {
  webpack(webpackConfig, { isServer }) {
    if (!isServer) {
      // Code splitting optimization
      webpackConfig.optimization = {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              filename: 'vendors/[name].js',
              test: /node_modules/,
              priority: 10,
            },
            // Common chunk
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              filename: 'common/[name].js',
            },
          },
        },
      };

      // Lazy loading configuration
      webpackConfig.output.filename = 'js/[name].[contenthash:8].js';
      webpackConfig.output.chunkFilename = 'js/[name].[contenthash:8].chunk.js';
    }

    return webpackConfig;
  },
};
