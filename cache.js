const Redis = require('redis');

const client = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

client.on('error', (err) => console.log('Redis Client Error', err));

async function getCache(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async function setCache(key, value, expiry = 3600) {
    try {
      await client.set(key, JSON.stringify(value), {
        EX: expiry
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
module.exports = { getCache, setCache };
