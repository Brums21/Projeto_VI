const Influxdb = require('influxdb-v2');

export const get_data_from_db = async (query_) => {
  try {
    const influxdb = new Influxdb({
      host: '10.255.33.33', //might be necessary to add the port -> check later
      token: 'M9Axugys0DnXwgkIb_SMc8Uaqf-0Hst4vbl44fV7IvY5c7yShUmjSlKwTWcUPpfsJpALW1DPxFiqgvZEglMB4Q=='
    });

    const result = await influxdb.query(
      { org: 'b0fd31eef1cd0a40' },
      { query: query_ }
    );

    console.log(result);

    return result
  }  
  catch (error) {
    console.error('\n An error occurred!', error);
    throw error;
  }
}

module.exports = get_data_from_db;