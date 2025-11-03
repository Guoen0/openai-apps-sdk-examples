import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div>
      Hello world
    </div>
  );
}

createRoot(document.getElementById("post-root")).render(<App />);

export { App };
export default App;

