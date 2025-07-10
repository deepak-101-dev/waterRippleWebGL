import { useState } from "react";
import WaterRipple from "./components/WaterRipple";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <WaterRipple width="100vw" height="100vh" />

      {/* 
      <div style={{ marginBottom: "20px" }}>
        <h3>Custom Size (500px x 300px)</h3>
        <WaterRipple width="500px" height="300px" />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Percentage Based (80% x 200px)</h3>
        <WaterRipple width="80%" height="200px" />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>With Border and Border Radius</h3>
        <WaterRipple
          width="400px"
          height="250px"
          style={{
            border: "2px solid #333",
            borderRadius: "10px",
            margin: "0 auto",
            display: "block",
          }}
        />
      </div> */}
    </>
  );
}

export default App;
