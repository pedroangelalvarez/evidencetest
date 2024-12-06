import React, { useRef, useState, useEffect } from "react";

const FrameGallery = () => {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [loading, setLoading] = useState(false); // Estado para controlar la carga de miniaturas

  // Handle video file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      setVideoSrc(videoURL);
      setThumbnails([]);
      setSelectedFrame(null);
      setLoading(true); // Activar el loader al seleccionar un video
    }
  };

  // Generate thumbnails
  const generateThumbnails = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const interval = 1; // Generate one thumbnail per second
    const duration = Math.floor(video.duration);
    const thumbnailArray = [];

    for (let time = 0; time < duration; time += interval) {
      video.currentTime = time;

      // Capture the frame once the video is ready
      video.addEventListener("seeked", function captureFrame() {
        canvas.width = video.videoWidth / 4;
        canvas.height = video.videoHeight / 4;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnailArray.push({
          time,
          data: canvas.toDataURL("image/jpeg"),
        });

        if (thumbnailArray.length === Math.ceil(duration / interval)) {
          setThumbnails(thumbnailArray);
          setLoading(false); // Desactivar el loader cuando se terminen de generar las miniaturas
        }

        video.removeEventListener("seeked", captureFrame);
      });
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("loadedmetadata", generateThumbnails);
    }
    return () => {
      if (video) {
        video.removeEventListener("loadedmetadata", generateThumbnails);
      }
    };
  }, [videoSrc]);

  // Select a frame
  const handleThumbnailClick = (thumbnail) => {
    setSelectedFrame(thumbnail);
    videoRef.current.currentTime = thumbnail.time;
  };

  // Handle download button click
  const handleDownload = () => {
    if (selectedFrame) {
      const link = document.createElement("a");
      link.href = selectedFrame.data;
      link.download = `frame-${selectedFrame.time}.jpg`;
      link.click();
    } else {
      alert("Por favor, selecciona un fotograma para descargar.");
    }
  };

  return (
    <div className="frame-gallery flex flex-col items-center min-h-screen relative">
      {/* Loader circular */}
      {loading && (
        <div className="loader-overlay flex justify-center items-center absolute top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 z-50">
          <div className="loader border-4 border-t-transparent border-blue-500 border-solid rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}

      {!videoSrc && (
        <div className="file-upload mb-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-blue-600 transition"
          >
            Seleccionar archivo de video
          </label>
        </div>
      )}

      {videoSrc && (
        <>
          <div className="video-container mb-4">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              style={{
                width: "80%",
                maxWidth: "100%",
                height: "auto",
                maxHeight: "50vh",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            />
          </div>

          <div
            className="thumbnail-slider mt-4 flex flex-row overflow-x-auto"
            style={{
              display: "flex",
              flexDirection: "row",
              overflowX: "auto",
              gap: "8px",
              width: "80%",
            }}
          >
            {thumbnails.map((thumbnail, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(thumbnail)}
                className={`thumbnail ${
                  selectedFrame?.time === thumbnail.time
                    ? "border-blue-500"
                    : "border-transparent"
                } border rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform duration-300`}
                style={{
                  flex: "0 0 auto",
                  width: "80px", // Tamaño de miniatura
                  height: "45px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src={thumbnail.data}
                  alt={`Frame at ${thumbnail.time}s`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover", // Asegura que la imagen se escale y recorte si es necesario
                  }}
                />
              </button>
            ))}
          </div>

          {/* Panel inferior con el botón de descarga */}
          <div
            className="footer-panel flex justify-end items-center w-full absolute bottom-0"
            style={{
              backgroundColor: "black",
              padding: "10px",
              borderRadius: "8px",
              boxShadow: "0 -4px 8px rgba(0, 0, 0, 0.2)",
              position: "fixed",
              left: 0,
            }}
          >
            <button
              onClick={handleDownload}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-blue-600 transition"
              style={{
                marginRight: "10px",
              }}
            >
              Descargar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FrameGallery;