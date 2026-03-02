import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./UploadEntry.css";

const API_BASE = "http://127.0.0.1:8000/api";

export default function UploadEntry() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    year: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const uploadData = new FormData();
      uploadData.append("name", formData.name);

      const details = {
        description: formData.description,
        address: formData.address,
        year: formData.year,
      };
      uploadData.append("details", JSON.stringify(details));

      if (imageFile) {
        uploadData.append("image", imageFile);
      }

      const response = await fetch(`${API_BASE}/entries/`, {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setSuccess(`Entry created successfully! ID: ${result.id}`);
      
      setTimeout(() => {
        navigate(`/entry/${result.id}`);
      }, 2000);
    } catch (err) {
      setError(`Failed to upload: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploadEntryPage">
      <Navbar />
      <main className="uploadContent">
        <div className="uploadContainer">
          <h1>Upload New Historical Entry</h1>
          
          <form onSubmit={handleSubmit} className="uploadForm">
            <div className="formGroup">
              <label htmlFor="name">Entry Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Battle of Waterloo"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Brief description of the historical event or location"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g., 600 Peachtree St NE, Atlanta, GA 30308"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="year">Year</label>
              <input
                type="text"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="e.g., 1815"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="image">Upload Image</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="imagePreviewContainer">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="imagePreview"
                  />
                </div>
              )}
            </div>

            {error && <div className="errorMessage">{error}</div>}
            {success && <div className="successMessage">{success}</div>}

            <div className="formActions">
              <button
                type="button"
                onClick={() => navigate("/all-entries")}
                className="cancelButton"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submitButton"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Create Entry"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
