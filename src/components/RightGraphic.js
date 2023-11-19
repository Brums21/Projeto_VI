import React, { useEffect } from 'react';
import D3_Graphic from './D3_Graphic';

function RightGraphic(){
    return (
        <div>
            <div className="graph-container" id="rightGraph">
                <D3_Graphic data="rightGraph"/>
            </div>
        </div>
    )
}

export default RightGraphic;