import React, { useState } from 'react';
import Select from 'react-select';

function StationComponent(){

    const [selectedOption, setSelectedOption] = useState("Station");

    const options_stations = [
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '7', label: '7' },
      ];

    const handleStationChange = (selected) => {
        setSelectedOption(selected.value);
    };

    return (
    <div>
        <div style={{marginBottom:"5%"}}> Station: 
            <Select
            value={options_stations.find(opt => opt.value === selectedOption)}
            onChange={handleStationChange}
            options={options_stations}
            />
        </div>
      </div>
        
    )
}

export default StationComponent;