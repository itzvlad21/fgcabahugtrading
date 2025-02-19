const sharp = require('sharp');
const path = require('path');

const imageOptimizer = async (req, res, next) => {
  if (!req.file) return next();

  const image = sharp(req.file.buffer);
  const metadata = await image.metadata();

  if (metadata.width > 1200) {
    const optimizedBuffer = await image
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    req.file.buffer = optimizedBuffer;
  }

  next();
};

module.exports = imageOptimizer;