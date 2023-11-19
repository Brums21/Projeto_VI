import React, { useEffect, useState } from 'react';
import queryInfluxDB from './influx.js'; // Replace with the actual path

const InfluxComponent = ({ query }) => {
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {

      try {
        const result = await queryInfluxDB(query);
        setQueryResult(result);
      } catch (error) {
        console.error('Error querying InfluxDB:', error);
      }
    };

    fetchData();
  }, []);
  console.log(JSON.stringify(queryResult, null, 2));
  return null;

};

export default InfluxComponent;