import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./AdminDashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || null;

const EMPTY_STOP = {
  address: "",
  spot_blurb: "",
  lat: null,
  lng: null,
  heading: 210,
  pitch: 10,
  fov: 90,
  pano: "",
};

const EMPTY_FORM = {
  name: "",
  blurb: "",
  description: "",
  obituary: "",
  stops: [{ ...EMPTY_STOP }],
};

function cloneForm(form) {
  return {
    ...form,
    stops: (form.stops || []).map((s) => ({ ...s })),
  };
}

function snapshotForm(form) {
  return JSON.stringify(cloneForm(form));
}

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
  const formRef = useRef(null);
  const [initialFormSnapshot, setInitialFormSnapshot] = useState("");
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Street View editor state
  const [streetViewOpenIndex, setStreetViewOpenIndex] = useState(null);
  const [streetViewLoading, setStreetViewLoading] = useState(false);
  const [streetViewError, setStreetViewError] = useState("");
  const [streetViewDraft, setStreetViewDraft] = useState(null);
  const [latLngLoadingIndex, setLatLngLoadingIndex] = useState(null);

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
    const nextForm = cloneForm(EMPTY_FORM);
    setFormData(nextForm);
    setInitialFormSnapshot(snapshotForm(nextForm));
    setImageFile(null);
    setImagePreview(null);
    setFormError("");
    setStreetViewOpenIndex(null);
    setStreetViewError("");
    setStreetViewDraft(null);
    setShowUnsavedPrompt(false);
    setModal({ mode: "add" });
  };

  const openEdit = (entry) => {
    let stops =
      Array.isArray(entry.stops) && entry.stops.length > 0
        ? entry.stops.map((s) => ({
            address: s.address || "",
            spot_blurb: s.spot_blurb || "",
            lat: s.lat ?? null,
            lng: s.lng ?? null,
            heading: typeof s.heading === "number" ? s.heading : 210,
            pitch: typeof s.pitch === "number" ? s.pitch : 10,
            fov: typeof s.fov === "number" ? s.fov : 90,
            pano: s.pano || "",
          }))
        : [
            {
              address: entry.details?.address || "",
              spot_blurb: "",
              lat: entry.details?.lat ?? null,
              lng: entry.details?.lng ?? null,
              heading: 210,
              pitch: 10,
              fov: 90,
              pano: "",
            },
          ];
    const nextForm = {
      name: entry.name || "",
      blurb: entry.details?.blurb || "",
      description: entry.details?.description || "",
      obituary: entry.details?.obituary || "",
      stops,
    };
    setFormData(nextForm);
    setInitialFormSnapshot(snapshotForm(nextForm));
    setImageFile(null);
    setImagePreview(entry.image || null);
    setFormError("");
    setStreetViewOpenIndex(null);
    setStreetViewError("");
    setStreetViewDraft(null);
    setShowUnsavedPrompt(false);
    setModal({ mode: "edit", entry });
  };

  const closeModalImmediate = () => {
    setModal(null);
    setImageFile(null);
    setImagePreview(null);
    setFormError("");
    setStreetViewOpenIndex(null);
    setStreetViewError("");
    setStreetViewDraft(null);
    setInitialFormSnapshot("");
    setShowUnsavedPrompt(false);
  };

  const hasUnsavedChanges =
    !!modal &&
    ((initialFormSnapshot && snapshotForm(formData) !== initialFormSnapshot) ||
      !!imageFile);

  const requestCloseModal = () => {
    if (formLoading) return;
    if (hasUnsavedChanges) {
      setShowUnsavedPrompt(true);
      return;
    }
    closeModalImmediate();
  };

  const handleUnsavedSave = () => {
    setShowUnsavedPrompt(false);
    formRef.current?.requestSubmit();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStopChange = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.stops];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, stops: next };
    });
  };

  const geocodeAddress = useCallback(async (address) => {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      address
    )}`;
    const geocodeRes = await fetch(geocodeUrl, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!geocodeRes.ok) {
      throw new Error(`Geocoding failed with HTTP ${geocodeRes.status}.`);
    }
    const geocodeData = await geocodeRes.json();
    if (!Array.isArray(geocodeData) || geocodeData.length === 0) {
      throw new Error("Unable to geocode this address.");
    }
    return {
      lat: Number(geocodeData[0].lat),
      lng: Number(geocodeData[0].lon),
    };
  }, []);

  const loadLatLngForStop = async (index) => {
    const stop = formData.stops[index];
    const address = (stop?.address || "").trim();
    if (!address) {
      setStreetViewError(
        "Please enter an address for this stop before loading coordinates."
      );
      return;
    }

    try {
      setStreetViewError("");
      setLatLngLoadingIndex(index);
      const { lat, lng } = await geocodeAddress(address);

      setFormData((prev) => {
        const next = [...prev.stops];
        next[index] = {
          ...next[index],
          lat,
          lng,
        };
        return { ...prev, stops: next };
      });

      if (streetViewOpenIndex === index && streetViewDraft) {
        setStreetViewDraft((prev) =>
          prev ? { ...prev, lat, lng } : prev
        );
      }
    } catch (err) {
      setStreetViewError(err.message || "Could not load coordinates.");
    } finally {
      setLatLngLoadingIndex(null);
    }
  };

  const openStreetViewEditor = async (index) => {
    const stop = formData.stops[index];
    const address = (stop?.address || "").trim();
    if (!address) {
      setStreetViewError(
        "Please enter an address for this stop before opening Street View."
      );
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      setStreetViewError("REACT_APP_GOOGLE_MAPS_API_KEY is not set.");
      return;
    }

    try {
      setStreetViewLoading(true);
      setStreetViewError("");
      let lat = stop.lat != null ? Number(stop.lat) : null;
      let lng = stop.lng != null ? Number(stop.lng) : null;

      if (lat == null || lng == null) {
        const geocoded = await geocodeAddress(address);
        lat = geocoded.lat;
        lng = geocoded.lng;
      }

      setStreetViewDraft({
        index,
        address,
        lat,
        lng,
        heading: Number.isFinite(stop.heading) ? stop.heading : 210,
        pitch: Number.isFinite(stop.pitch) ? stop.pitch : 10,
        fov: Number.isFinite(stop.fov) ? stop.fov : 90,
        pano: stop.pano || "",
      });
      setStreetViewOpenIndex(index);
    } catch (err) {
      setStreetViewError(err.message || "Could not load Street View.");
    } finally {
      setStreetViewLoading(false);
    }
  };

  const handleStreetViewDraftChange = (patch) => {
    setStreetViewDraft((prev) => ({ ...prev, ...patch }));
  };

  const confirmStreetView = () => {
    if (streetViewOpenIndex == null || !streetViewDraft) return;
    setFormData((prev) => {
      const next = [...prev.stops];
      const existing = next[streetViewOpenIndex] || { ...EMPTY_STOP };
      next[streetViewOpenIndex] = {
        ...existing,
        lat: streetViewDraft.lat,
        lng: streetViewDraft.lng,
        heading: streetViewDraft.heading,
        pitch: streetViewDraft.pitch,
        fov: streetViewDraft.fov,
        pano: streetViewDraft.pano || "",
      };
      return { ...prev, stops: next };
    });
    setStreetViewOpenIndex(null);
    setStreetViewDraft(null);
  };

  const cancelStreetView = () => {
    setStreetViewOpenIndex(null);
    setStreetViewDraft(null);
  };

  const addStop = () => {
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, { ...EMPTY_STOP }],
    }));
  };

  const removeStop = (index) => {
    setFormData((prev) => {
      if (prev.stops.length <= 1) return prev;
      const next = prev.stops.filter((_, i) => i !== index);
      return { ...prev, stops: next };
    });
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
      const toFiniteNumber = (value) => {
        if (value == null || value === "") return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      };

      const primaryAddress = (formData.stops[0]?.address || "").trim();
      const stopsPayload = formData.stops
        .map((s) => ({
          address: (s.address || "").trim(),
          spot_blurb: (s.spot_blurb || "").trim(),
          ...(toFiniteNumber(s.lat) != null ? { lat: toFiniteNumber(s.lat) } : {}),
          ...(toFiniteNumber(s.lng) != null ? { lng: toFiniteNumber(s.lng) } : {}),
          ...(s.heading != null ? { heading: Number(s.heading) } : {}),
          ...(s.pitch != null ? { pitch: Number(s.pitch) } : {}),
          ...(s.fov != null ? { fov: Number(s.fov) } : {}),
          ...(s.pano ? { pano: s.pano } : {}),
        }))
        .filter((s) => s.address);

      const body = new FormData();
      body.append("name", formData.name);
      body.append(
        "details",
        JSON.stringify({
          blurb: formData.blurb,
          description: formData.description,
          address: primaryAddress,
          obituary: formData.obituary,
        })
      );
      body.append("stops", JSON.stringify(stopsPayload.length ? stopsPayload : formData.stops));
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
      closeModalImmediate();
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
        <div className="adminModalOverlay" onClick={requestCloseModal}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h2>{modal.mode === "add" ? "Add New Entry" : "Edit Entry"}</h2>
              <button className="adminModalClose" onClick={requestCloseModal}>
                ×
              </button>
            </div>
            <form ref={formRef} onSubmit={handleFormSubmit} className="adminModalForm">
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

              <div className="adminStopsSection">
                <div className="adminStopsSectionHead">
                  <label>Locations / stops *</label>
                  <button
                    type="button"
                    className="adminAddStopBtn"
                    onClick={addStop}
                  >
                    + Add stop
                  </button>
                </div>
                <p className="adminStopsHint">
                  Each stop has an address (for the map) and a short blurb (shown on the entry
                  page). At least one address is required. Use "Detect View" to set heading,
                  pitch, and zoom.
                </p>
                {formData.stops.map((stop, idx) => (
                  <div className="adminStopCard" key={idx}>
                    <div className="adminStopCardHead">
                      <span>Stop {idx + 1}</span>
                      {formData.stops.length > 1 && (
                        <button
                          type="button"
                          className="adminRemoveStopBtn"
                          onClick={() => removeStop(idx)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required={idx === 0}
                      value={stop.address}
                      onChange={(e) =>
                        handleStopChange(idx, "address", e.target.value)
                      }
                      placeholder="Street address"
                    />
                    <textarea
                      rows={2}
                      value={stop.spot_blurb}
                      onChange={(e) =>
                        handleStopChange(idx, "spot_blurb", e.target.value)
                      }
                      placeholder="Short blurb for this spot (map tooltip)"
                    />
                    <div className="adminStopTools">
                      <button
                        type="button"
                        className="adminLoadCoordsBtn"
                        onClick={() => loadLatLngForStop(idx)}
                        disabled={latLngLoadingIndex === idx}
                      >
                        {latLngLoadingIndex === idx ? "Loading…" : "Load Lat/Lng"}
                      </button>
                      <button
                        type="button"
                        className="adminDetectViewBtn"
                        onClick={() => openStreetViewEditor(idx)}
                        disabled={streetViewLoading}
                      >
                        {streetViewLoading && streetViewOpenIndex === idx
                          ? "Opening…"
                          : "Detect View"}
                      </button>
                      {stop.lat != null && stop.lng != null && (
                        <span className="adminViewMeta">
                          Saved view: h {Math.round(stop.heading ?? 210)}°, p {Math.round(
                            stop.pitch ?? 10
                          )}
                          °, fov {Math.round(stop.fov ?? 90)}°
                        </span>
                      )}
                    </div>

                    {streetViewOpenIndex === idx && streetViewDraft && (
                      <StreetViewEditor
                        draft={streetViewDraft}
                        onDraftChange={handleStreetViewDraftChange}
                        onCancel={cancelStreetView}
                        onConfirm={confirmStreetView}
                      />
                    )}
                  </div>
                ))}
                {streetViewError && <p className="adminFormError">{streetViewError}</p>}
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
                  onClick={requestCloseModal}
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

      {showUnsavedPrompt && (
        <div className="adminModalOverlay" onClick={() => setShowUnsavedPrompt(false)}>
          <div
            className="adminModal adminConfirmModal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Unsaved Changes</h2>
            <p>
              You have unsaved changes. Do you want to save before closing?
            </p>
            <div className="adminModalFooter">
              <button
                className="adminCancelBtn"
                onClick={() => setShowUnsavedPrompt(false)}
              >
                Keep Editing
              </button>
              <button
                className="adminDeleteBtn"
                onClick={closeModalImmediate}
              >
                Discard
              </button>
              <button
                className="adminSaveBtn"
                onClick={handleUnsavedSave}
                disabled={formLoading}
              >
                Save
              </button>
            </div>
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

function StreetViewEditor({ draft, onDraftChange, onCancel, onConfirm }) {
  const setDraftNumberField = (field, rawValue) => {
    if (rawValue === "") {
      onDraftChange({ [field]: "" });
      return;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    onDraftChange({ [field]: parsed });
  };

  const previewParams = new URLSearchParams();
  if (GOOGLE_MAPS_API_KEY) previewParams.set("key", GOOGLE_MAPS_API_KEY);
  if (draft.pano) {
    previewParams.set("pano", draft.pano);
  } else if (draft.lat !== "" && draft.lng !== "") {
    previewParams.set("location", `${draft.lat},${draft.lng}`);
  }
  previewParams.set("heading", String(draft.heading ?? 210));
  previewParams.set("pitch", String(draft.pitch ?? 10));
  previewParams.set("fov", String(draft.fov ?? 90));

  return (
    <div className="adminStreetViewEditor">
      <p className="adminStreetViewHint">
        Adjust heading, pitch, and field of view using the controls below. The iframe preview
        updates live, then confirm to save this stop's view.
      </p>
      <div className="adminStreetViewCanvas">
        <iframe
          title="Street View preview"
          className="adminStreetViewIframe"
          loading="lazy"
          allowFullScreen
          allow="accelerometer; gyroscope; fullscreen"
          src={`https://www.google.com/maps/embed/v1/streetview?${previewParams.toString()}`}
        />
      </div>
      <div className="adminStreetViewReadout">
        <span>Lat {draft.lat}</span>
        <span>Lng {draft.lng}</span>
        <span>Heading {draft.heading}°</span>
        <span>Pitch {draft.pitch}°</span>
        <span>FOV {draft.fov}°</span>
      </div>
      <div className="adminStreetViewControls">
        <label>
          Heading
          <input
            type="range"
            min="-180"
            max="360"
            step="1"
            value={draft.heading ?? 210}
            onChange={(e) => onDraftChange({ heading: Number(e.target.value) })}
          />
        </label>
        <label>
          Pitch
          <input
            type="range"
            min="-90"
            max="90"
            step="1"
            value={draft.pitch ?? 10}
            onChange={(e) => onDraftChange({ pitch: Number(e.target.value) })}
          />
        </label>
        <label>
          FOV
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={draft.fov ?? 90}
            onChange={(e) => onDraftChange({ fov: Number(e.target.value) })}
          />
        </label>
        <label>
          Latitude
          <input
            type="number"
            step="0.000001"
            value={draft.lat ?? ""}
            onChange={(e) => setDraftNumberField("lat", e.target.value)}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="0.000001"
            value={draft.lng ?? ""}
            onChange={(e) => setDraftNumberField("lng", e.target.value)}
          />
        </label>
      </div>
      <div className="adminStreetViewActions">
        <button type="button" className="adminCancelBtn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="adminSaveBtn" onClick={onConfirm}>
          Confirm View
        </button>
      </div>
    </div>
  );
}
