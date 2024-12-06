import React from "react";
import FrameGallery from "./FrameGallery";

const App = () => {
  return (
    <div className="app">
      <h1 className="text-center text-2xl font-bold">Evidence Test</h1>
      <FrameGallery videoSrc="/path-to-your-video.mp4" />
    </div>
  );
};

export default App;