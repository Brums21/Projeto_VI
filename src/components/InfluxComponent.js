import React, { useEffect, useState } from 'react';
import queryInfluxDB from './influx.js'; // Replace with the actual path

const InfluxComponent = ({ query, updateGraph }) => {
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await queryInfluxDB(query);
        setQueryResult(result);
        updateGraph(result); // Pass the result back to the parent component
      } catch (error) {
        console.error('Error querying InfluxDB:', error);
      }
    };

    fetchData();
  }, [query, updateGraph]); // Add query and updateGraph as dependencies

  console.log(JSON.stringify(queryResult, null, 2));
  return null;
};

export default InfluxComponent;
