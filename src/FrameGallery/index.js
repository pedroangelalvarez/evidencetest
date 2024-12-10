import React, { useRef, useState, useEffect } from "react";
import { Document, Packer, Paragraph, Media, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";
import * as fs from "file-saver"; 
import "./index.css";

const FrameGallery = () => {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [savedFrames, setSavedFrames] = useState([]); // Miniaturas seleccionadas
  const [originalFrames, setOriginalFrames] = useState([]); // Imágenes originales
  const canvasRef = useRef(document.createElement("canvas"));
  const [loading, setLoading] = useState(false);

  const [highlightedThumbnail, setHighlightedThumbnail] = useState(null);


  // Handle video file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      setVideoSrc(videoURL);
      setThumbnails([]);
      setSelectedFrame(null);
      setSavedFrames([]);
      setLoading(true);
    }
  };

  // Generate thumbnails
  const generateThumbnails = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const interval = 1; // Generate one thumbnail per second
    const duration = Math.floor(video.duration);
    const thumbnailArray = [];

    const captureFrame = (time) => {
      return new Promise((resolve) => {
        video.currentTime = time;

        video.addEventListener("seeked", function captureHandler() {
          canvas.width = video.videoWidth / 4;
          canvas.height = video.videoHeight / 4;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnailArray.push({
            time,
            data: canvas.toDataURL("image/jpeg"),
          });
          if (thumbnailArray.length === Math.ceil(duration / interval)) {
            setThumbnails(thumbnailArray);
            setLoading(false);
          }

          video.removeEventListener("seeked", captureHandler);
          resolve();
        });
      });
    };

    (async () => {
      for (let time = 0; time < duration; time += interval) {
        await captureFrame(time);
      }
      setThumbnails(thumbnailArray);
    })();
  };

  // Select a frame and store it in the saved frames array
  const handleThumbnailClick = (thumbnail) => {
    setSelectedFrame(thumbnail);
    videoRef.current.currentTime = thumbnail.time;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  };

  const handleThumbnailDoubleClick = (thumbnail) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    video.currentTime = thumbnail.time;

    video.addEventListener("seeked", function captureOriginalHandler() {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const originalImage = canvas.toDataURL("image/jpeg");

      setSavedFrames((prev) => [...prev, thumbnail]); // Guarda miniatura
      setOriginalFrames((prev) => [...prev, originalImage]); // Guarda imagen original
      setHighlightedThumbnail(thumbnail);
      video.removeEventListener("seeked", captureOriginalHandler);
    });
  };

  // Remove a saved frame from the saved frames array
  const handleSavedFrameClick = (thumbnailToRemove) => {
    setSavedFrames((prevFrames) =>
      prevFrames.filter((frame) => frame.time !== thumbnailToRemove.time)
    ); // Remove the clicked frame
  };

  // Genera y descarga un archivo Word con las imágenes
  const handleDownloadAllToWord = () => {
    const panel = document.getElementById("fotogramas");
    const images = panel.querySelectorAll("img");

    if (!savedFrames || savedFrames.length === 0) {
      alert("No hay imágenes para descargar.");
      return;
    }
  
    // Crear un documento Word con las imágenes del panel inferior
    const doc = new Document({
      sections: [
        {
          children: Array.from(images).map((img) => {
            const base64Data = img.src.split(",")[1];
            const buffer = Uint8Array.from(atob(base64Data), (char) =>
              char.charCodeAt(0)
            );
  
            return new Paragraph({
              children: [
                new ImageRun({
                  data: buffer, // Convertir Base64 a binario
                  transformation: {
                    width: 550, // Ajusta el tamaño de las imágenes
                    height: 300,
                  },
                }),
              ],
            });
          }),
        },
      ],
    });

    // Generar y descargar el archivo Word
    Packer.toBlob(doc).then((blob) => {
      fs.saveAs(blob, `Evidencia-${new Date().toISOString()}.docx`);
    }).catch((error) => {
      console.error("Error al generar el archivo Word:", error);
      alert("Hubo un error al generar el archivo Word. Por favor, revisa la consola para más detalles.");
    });
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

  return (
    <div className="frame-gallery flex flex-col items-center min-h-screen">
      {/* Loader circular */}
      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
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
                onDoubleClick={() => handleThumbnailDoubleClick(thumbnail)} // Double-click to save the frame
                className={`thumbnail ${
                  selectedFrame?.time === thumbnail.time
                    ? "border-blue-500"
                    : "border-transparent"
                } border rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform duration-300`}
                style={{
                  flex: "0 0 auto",
                  width: "80px",
                  height: "45px",
                  display: "flex",
                  justifyContent: "center",
                  borderColor: highlightedThumbnail?.time === thumbnail.time ? "#9AE6B4" : "transparent",
                  alignItems: "center",
                  
                }}
              >
                <img
                  src={thumbnail.data}
                  alt={`Frame at ${thumbnail.time}s`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Panel inferior para mostrar miniaturas guardadas */}
          <div
            className="saved-frames-container mt-4"
            style={{
              width: "80%",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: "8px",
              backgroundColor: "#f0f0f0",
              padding: "10px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            
            {savedFrames.map((frame, index) => (
              <div
                key={index}
                className="saved-frame"
                onClick={() => handleSavedFrameClick(frame)} // Click to remove the frame
                style={{
                  width: "80px",
                  height: "45px",
                  border: "2px solid #ccc",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                }}
              >
                <img
                  src={frame.data}
                  alt={`Saved frame at ${frame.time}s`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Panel invisible para imágenes originales */}
          <div id="fotogramas" style={{ display: "none" }}>
            {originalFrames.map((image, index) => (
              <img key={index} src={image} alt={`Original frame ${index}`} />
            ))}
          </div>

          {/* Botón para descargar todas las miniaturas en calidad original */}
          {savedFrames.length > 0 && (
            <button
              onClick={handleDownloadAllToWord}
              className="button"
            >
              Descargar Evidencia
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default FrameGallery;