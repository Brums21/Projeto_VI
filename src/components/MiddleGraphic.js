import React, { useState } from 'react';
import Select from 'react-select';
import D3_Graphic from './D3_Graphic';

function MiddleGraphic() {
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

  const handleVehicleChange = (selected) => {
    setSelectedOption(selected.value);
  };

  const handleMeteorologyChange = (selected) => {
    setSelectedOption(selected.value);
  };

  const onValueChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div>

      <div style={{marginBottom:"5%"}}>
        <Select
          value={options_vehicles.find(opt => opt.value === selectedOption)}
          onChange={handleVehicleChange}
          options={options_vehicles}
        />
      </div>

      <div style={{marginBottom:"5%"}}> 
        <Select  
          value={options_meteorology.find(opt => opt.value === selectedOption)}
          onChange={handleMeteorologyChange}
          options={options_meteorology}
        />
      </div>
       
      <form>
        <label>
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
      <div>
        Selected option is : {selectedOption}
      </div>
      <div className="graph-container" id="middleGraph">
        <D3_Graphic data="middleGraph" />
      </div>
    </div>
  )
}

export default MiddleGraphic;