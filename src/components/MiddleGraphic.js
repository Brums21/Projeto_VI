import React, { useState } from 'react';
import Select from 'react-select';
import D3_Graphic from './D3_Graphic';

function MiddleGraphic({ station }) {
  const [selectedOptionVehicle, setSelectedOptionVehicle] = useState("Vehicle Type");
  const [selectedOptionMeteorology, setSelectedOptionMeteorology] = useState("Meteorology");
  const [selectedOptionTime, setSelectedOptionTime] = useState("Time Period");
  const [selectedOption, setSelectedOption] = useState("Vehicle Speed");

  const options_vehicles = [
    { value: '2', label: 'Motorcycle' },
    { value: '3', label: 'Car' },
    { value: '5', label: 'LightTruck' },
    { value: '6', label: 'HeavyTruck' },
  ];

  const options_meteorology = [
    { value: 'humidity_avg', label: 'Humidity' },
    { value: 'precipitation', label: 'Precipitation' },
    { value: 'radiance', label: 'Radiance' },
    { value: 'temp_avg', label: 'Temperature' },
  ];

  const options_time = [
    { value: 'last_hour', label: 'Last Hour' },
    { value: 'last_24h', label: 'Last 24 hours' },
    { value: 'last_week', label: 'Last week' },
    { value: 'last_month', label: 'Last month' },
  ];

  const handleVehicleChange = (selected) => {
    setSelectedOptionVehicle(selected.value);
  };

  const handleMeteorologyChange = (selected) => {
    setSelectedOptionMeteorology(selected.value);
  };

  const handleTimePeriodChange = (selected) => {
    setSelectedOptionTime(selected.value);
  };

  const onValueChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div>
      <div style={{ marginBottom: "5%" }}> Vehicle type:
        <Select
          value={options_vehicles.find(opt => opt.value === selectedOptionVehicle)}
          onChange={handleVehicleChange}
          options={options_vehicles}
        />
      </div>

      <div style={{ marginBottom: "5%" }}> Meteorology data:
        <Select
          value={options_meteorology.find(opt => opt.value === selectedOptionMeteorology)}
          onChange={handleMeteorologyChange}
          options={options_meteorology}
        />
      </div>
      <div style={{ marginBottom: "5%" }}> Time Period
        <Select
          value={options_time.find(opt => opt.value === selectedOptionTime)}
          onChange={handleTimePeriodChange}
          options={options_time}
        />
      </div>

      <form style={{ marginBottom: "5%" }}>
        <label style={{ marginRight: "5%" }}>
          <input
            type='radio'
            name="graph_type"
            value="Vehicle Speed"
            checked={selectedOption === "Vehicle Speed"}
            onChange={onValueChange}
          />
          Vehicle Speed
        </label>
        <label>
          <input
            type='radio'
            name="graph_type"
            value="Vehicle Road Inflow"
            checked={selectedOption === "Vehicle Road Inflow"}
            onChange={onValueChange}
          />
          Vehicle Road Inflow
        </label>
        <br />
      </form>
      <D3_Graphic data="middleGraph" meteorology={selectedOptionMeteorology} />
      <div className="graph-container" id="middleGraph">  
      </div>
    </div>
  );
}

export default MiddleGraphic;
