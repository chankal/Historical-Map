import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./AdminDashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

const EMPTY_FORM = {
  name: "",
  blurb: "",
  description: "",
  address: "",
  year: "",
  obituary: "",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal: null | { mode: 'add' | 'edit', entry?: {} }
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem("admin_token");

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  // Verify token on mount; redirect to login if invalid
  useEffect(() => {
    if (!token) {
      navigate("/admin", { replace: true });
      return;
    }
    fetch(`${API_BASE}/admin-auth/verify/`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) {
          localStorage.removeItem("admin_token");
          navigate("/admin", { replace: true });
        }
      })
      .catch(() => navigate("/admin", { replace: true }));
  }, [token, navigate, authHeaders]);

  // Load all entries
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/all/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEntries(await res.json());
    } catch (err) {
      setError(`Failed to load entries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // --- Modal helpers ---
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setFormError("");
    setModal({ mode: "add" });
  };

  const openEdit = (entry) => {
    setFormData({
      name: entry.name || "",
      blurb: entry.details?.blurb || "",
      description: entry.details?.description || "",
      address: entry.details?.address || "",
      year: entry.details?.year || "",
      obituary: entry.details?.obituary || "",
    });
    setImageFile(null);
    setImagePreview(entry.image || null);
    setFormError("");
    setModal({ mode: "edit", entry });
  };

  const closeModal = () => {
    setModal(null);
    setImageFile(null);
    setImagePreview(null);
    setFormError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append(
        "details",
        JSON.stringify({
          blurb: formData.blurb,
          description: formData.description,
          address: formData.address,
          year: formData.year,
          obituary: formData.obituary,
        })
      );
      if (imageFile) body.append("image_upload", imageFile);

      const isEdit = modal.mode === "edit";
      const url = isEdit
        ? `${API_BASE}/entries/${modal.entry.id}/`
        : `${API_BASE}/entries/`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: authHeaders(),
        body,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data));
      }
      closeModal();
      fetchEntries();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/entries/${deleteTarget.id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json();
        throw new Error(JSON.stringify(data));
      }
      setDeleteTarget(null);
      fetchEntries();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="adminDashPage">
      <Navbar />
      <main className="adminDashContent">
        {/* Page header */}
        <div className="adminDashHeader">
          <div>
            <h1 className="adminDashTitle">Manage Entries</h1>
            <p className="adminDashSubtitle">
              {entries.length} {entries.length === 1 ? "entry" : "entries"} in
              the database
            </p>
          </div>
          <div className="adminDashActions">
            <button className="adminAddBtn" onClick={openAdd}>
              + Add Entry
            </button>
            <button className="adminLogoutBtn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>

        {error && <p className="adminError">{error}</p>}

        {loading ? (
          <p className="adminLoading">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="adminEmpty">No entries yet. Add one to get started.</p>
        ) : (
          <div className="adminTable">
            <div className="adminTableHeader">
              <span>#</span>
              <span>Name</span>
              <span>Address</span>
              <span>Year</span>
              <span>Image</span>
              <span>Actions</span>
            </div>
            {entries.map((entry, idx) => (
              <div className="adminTableRow" key={entry.id}>
                <span className="adminRowNum">{idx + 1}</span>
                <span className="adminRowName">{entry.name}</span>
                <span className="adminRowMeta">
                  {entry.details?.address || "—"}
                </span>
                <span className="adminRowMeta">
                  {entry.details?.year || "—"}
                </span>
                <span className="adminRowImg">
                  {entry.image ? (
                    <img src={entry.image} alt={entry.name} />
                  ) : (
                    <span className="adminNoImg">None</span>
                  )}
                </span>
                <span className="adminRowBtns">
                  <button
                    className="adminEditBtn"
                    onClick={() => openEdit(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className="adminDeleteBtn"
                    onClick={() =>
                      setDeleteTarget({ id: entry.id, name: entry.name })
                    }
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="adminModalOverlay" onClick={closeModal}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h2>{modal.mode === "add" ? "Add New Entry" : "Edit Entry"}</h2>
              <button className="adminModalClose" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="adminModalForm">
              <div className="adminFormGroup">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., John Wesley Dobbs"
                />
              </div>

              <div className="adminFormGroup">
                <label htmlFor="blurb">Blurb</label>
                <input
                  id="blurb"
                  name="blurb"
                  value={formData.blurb}
                  onChange={handleFormChange}
                  required
                  placeholder="Short subtitle"
                />
              </div>

              <div className="adminFormGroup">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  rows={5}
                  placeholder="Full description…"
                />
              </div>

              <div className="adminFormRow">
                <div className="adminFormGroup">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g., 600 Peachtree St NE"
                  />
                </div>
                <div className="adminFormGroup">
                  <label htmlFor="year">Year</label>
                  <input
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleFormChange}
                    placeholder="e.g., 1815"
                  />
                </div>
              </div>

              <div className="adminFormGroup">
                <label htmlFor="obituary">Obituary Link</label>
                <input
                  id="obituary"
                  type="url"
                  name="obituary"
                  value={formData.obituary}
                  onChange={handleFormChange}
                  placeholder="Link to obituary"
                />
              </div>

              <div className="adminFormGroup">
                <label htmlFor="image_upload">
                  Image {modal.mode === "edit" && imagePreview && "(replace)"}
                </label>
                <input
                  id="image_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="adminImgPreview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              {formError && <p className="adminFormError">{formError}</p>}

              <div className="adminModalFooter">
                <button
                  type="button"
                  className="adminCancelBtn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adminSaveBtn"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving…"
                    : modal.mode === "add"
                    ? "Add Entry"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="adminModalOverlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="adminModal adminConfirmModal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Delete Entry</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div className="adminModalFooter">
              <button
                className="adminCancelBtn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="adminDeleteConfirmBtn"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
