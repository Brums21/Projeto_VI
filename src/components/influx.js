const Influxdb = require('influxdb-v2');

async function queryInfluxDB(query) {
  console.log(query)
  try {
    const influxdb = new Influxdb({
      protocol: 'http',
      host: '10.255.33.33',
      port: 8086,
      token: 'M9Axugys0DnXwgkIb_SMc8Uaqf-0Hst4vbl44fV7IvY5c7yShUmjSlKwTWcUPpfsJpALW1DPxFiqgvZEglMB4Q=='
    });

    const result = await influxdb.query(
      { org: 'b0fd31eef1cd0a40' }, 
      { query: query }
    );

    return result;
  } catch (error) {
    console.error('\n An error occurred!', error);
    throw error; 
  }
}

module.exports = queryInfluxDB;