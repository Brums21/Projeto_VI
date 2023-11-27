import React, { useState } from 'react';
import Select from 'react-select';
import D3_Graphic from './D3_Graphic';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import "rsuite/dist/rsuite.min.css";
import DateRangePicker from 'rsuite/DateRangePicker';
import Accordion from 'react-bootstrap/Accordion';


function MiddleGraphic({ station }) {
  const [selectedOptionVehicle, setSelectedOptionVehicle] = useState("3");
  const [selectedOptionMeteorology, setSelectedOptionMeteorology] = useState("temp_avg");
  const [selectedOption, setSelectedOption] = useState("speed_meteorological");
  const {allowedRange} = DateRangePicker;
  const today = new Date();

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  const [selectedDate, setSelectedDate] = useState([oneWeekAgo, today]);

  const options_vehicles = [
    { value: '2', label: 'Motorcycle' },
    { value: '3', label: 'Car' },
    { value: '5', label: 'LightTruck' },
    { value: '6', label: 'HeavyTruck' }
  ];

  const options_meteorology = [
    { value: 'temp_avg', label: 'Temperature' },
    { value: 'humidity_avg', label: 'Humidity' },
    { value: 'precepitation', label: 'Precepitation' },
    { value: 'radiance', label: 'Radiance' },
  ];

  const handleDateChange = (value) => {
    setSelectedDate(value);
  };

  const handleVehicleChange = (selected) => {
    setSelectedOptionVehicle(selected.value);
  };

  const handleMeteorologyChange = (selected) => {
    setSelectedOptionMeteorology(selected.value);
  };

  const onValueChange = (selected) => {
    setSelectedOption(selected);
  };

  return (
    <div>
      <div className="row">
        <div className='item'>
          <div>Time Period:</div>
          <DateRangePicker
            value={selectedDate}
            onChange={handleDateChange}
            shouldDisableDate={allowedRange(oneMonthAgo, today)}
          />
        </div>
        <div className="item"> Vehicle type:
          <Select
            value={options_vehicles.find(opt => opt.value === selectedOptionVehicle)}
            onChange={handleVehicleChange}
            options={options_vehicles}
          />
        </div> 
        {selectedOption !== "speed_traffic"  && (
          <div className="item"> Meteorology data:
            <Select
              value={options_meteorology.find(opt => opt.value === selectedOptionMeteorology)}
              onChange={handleMeteorologyChange}
              options={options_meteorology}
            />
          </div>
        )}
      </div>
      <Tabs defaultActiveKey="profile" activeKey={selectedOption} onSelect={onValueChange} id="fill-tab-example" className="mb-3" fill>
        <Tab eventKey="speed_meteorological" title="Vehicle Speed with Meteorological Data"></Tab>
        <Tab eventKey="inflow_meteorological" title="Vehicle Road Inflow with Meteorological Data"></Tab>
        <Tab eventKey="speed_traffic" title="Vehicle Speed with Vehicle Road Inflow"></Tab>
      </Tabs>
      <D3_Graphic data="middleGraph" station={station} meteorology={selectedOptionMeteorology} vehicle_type={selectedOptionVehicle} date={selectedDate} graph_type={selectedOption}/>
      
    </div>
  );
}

export default MiddleGraphic;
