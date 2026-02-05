export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  exchange: {
    apiUrl: process.env.EXCHANGE_API_URL || 'https://api.exchangerate-api.com/v4/latest',
    timeout: parseInt(process.env.EXCHANGE_API_TIMEOUT, 10) || 5000,
  },
  cep: {
    apiUrl: process.env.CEP_API_URL || 'https://viacep.com.br/ws',
    timeout: parseInt(process.env.CEP_API_TIMEOUT, 10) || 5000,
  },
});
