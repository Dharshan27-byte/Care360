import React, { useEffect, useState } from "react";
import { api } from "../api";
import { NearbyCareExplorer, useNearbyCare } from "../components/NearbyCare";

function nextVisitTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setMinutes(0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function CareAppointmentsPage() {
  const care = useNearbyCare(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [items, setItems] = useState([]);
  const [values, setValues] = useState({
    doctorName: "",
    specialty: "",
    appointmentAt: nextVisitTime(),
    notes: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAppointments = () =>
    api("/appointments")
      .then(setItems)
      .catch((requestError) => setError(requestError.message));

  useEffect(() => {
    loadAppointments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveVisit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!selectedPlace) {
      setError("Choose a nearby hospital or clinic above first.");
      return;
    }
    try {
      await api("/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorName: values.doctorName.trim() || "Provider to be confirmed",
          specialty: values.specialty.trim() || "General consultation",
          clinicName: selectedPlace.name,
          appointmentAt:
            values.appointmentAt.length === 16
              ? `${values.appointmentAt}:00`
              : values.appointmentAt,
          notes: values.notes.trim(),
        }),
      });
      setMessage(
        "Visit plan saved. Call the facility to confirm availability; Care360 has not booked it with them.",
      );
      loadAppointments();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function cancelVisit(id) {
    try {
      await api(`/appointments/${id}`, { method: "DELETE" });
      loadAppointments();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="PLAN YOUR NEXT VISIT"
        title="Find care, then plan your visit"
        intro="Use your location to explore nearby hospitals and clinics, choose a place, and save a visit plan."
      />

      <NearbyCareExplorer
        care={care}
        selectable
        selectedId={selectedPlace?.id}
        onChoose={setSelectedPlace}
      />

      <div className="appointment-record-layout">
        <section className="panel appointment-plan-panel">
          <div className="plan-heading">
            <span className="plan-step">01</span>
            <div>
              <span className="eyebrow">YOUR VISIT PLAN</span>
              <h2>
                {selectedPlace ? selectedPlace.name : "Choose a care location"}
              </h2>
              <p>
                {selectedPlace
                  ? `${selectedPlace.distanceKm} km from your search point${selectedPlace.phone ? ` · ${selectedPlace.phone}` : ""}`
                  : "Select a facility from the map or nearby list above."}
              </p>
            </div>
          </div>

          {selectedPlace && (
            <div className="selected-facility-actions">
              {selectedPlace.phone && (
                <a
                  className="button button-secondary"
                  href={`tel:${selectedPlace.phone}`}
                >
                  Call facility <span>↗</span>
                </a>
              )}
              <a
                className="button button-secondary"
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions <span>↗</span>
              </a>
            </div>
          )}

          <form
            className="form-stack appointment-plan-form"
            onSubmit={saveVisit}
          >
            <div className="appointment-form-pair">
              <Field
                label="Doctor or provider (optional)"
                name="doctorName"
                value={values.doctorName}
                onChange={(event) =>
                  setValues({ ...values, doctorName: event.target.value })
                }
                placeholder="Leave blank if not known yet"
                maxLength="120"
              />
              <Field
                label="Specialty (optional)"
                name="specialty"
                value={values.specialty}
                onChange={(event) =>
                  setValues({ ...values, specialty: event.target.value })
                }
                placeholder="Defaults to general consultation"
                maxLength="120"
              />
            </div>
            <Field
              label="Preferred date and time"
              name="appointmentAt"
              type="datetime-local"
              min={nextVisitTime()}
              value={values.appointmentAt}
              onChange={(event) =>
                setValues({ ...values, appointmentAt: event.target.value })
              }
              required
            />
            <Field
              label="Notes for yourself (optional)"
              name="notes"
              value={values.notes}
              onChange={(event) =>
                setValues({ ...values, notes: event.target.value })
              }
              placeholder="A reminder to take your reports, for example"
              maxLength="500"
            />
            <div className="appointment-transparency">
              <span>i</span>
              <p>
                This saves a personal reminder in Care360. It does not reserve a
                slot or send your details to the hospital.
              </p>
            </div>
            <Feedback error={error} message={message} />
            <button className="button button-primary" disabled={!selectedPlace}>
              Save visit plan <span>→</span>
            </button>
          </form>
        </section>

        <section className="panel history-panel visit-history-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR SCHEDULE</span>
              <h2>Visit plans</h2>
            </div>
            <span className="record-count">{items.length} total</span>
          </div>
          {items.length ? (
            <div className="appointment-list">
              {items.map((item) => (
                <article
                  className={`visit-card ${item.status === "CANCELLED" ? "visit-cancelled" : ""}`}
                  key={item.id}
                >
                  <div className="visit-date">
                    <strong>
                      {new Date(item.appointmentAt).toLocaleDateString(
                        undefined,
                        {
                          day: "2-digit",
                        },
                      )}
                    </strong>
                    <span>
                      {new Date(item.appointmentAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <div className="visit-detail">
                    <div className="visit-title-row">
                      <h3>{item.clinicName}</h3>
                      <span
                        className={`status-chip ${item.status === "CANCELLED" ? "status-muted" : ""}`}
                      >
                        {item.status === "CANCELLED" ? "Removed" : "Visit plan"}
                      </span>
                    </div>
                    <p>
                      {item.doctorName} · {item.specialty}
                    </p>
                    <small>
                      {new Date(item.appointmentAt).toLocaleTimeString(
                        undefined,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </small>
                  </div>
                  {item.status !== "CANCELLED" && (
                    <button
                      className="icon-button cancel-button"
                      onClick={() => cancelVisit(item.id)}
                      aria-label="Remove visit plan"
                    >
                      ×
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="▦"
              title="Your visit plans will appear here"
              text="Pick a nearby facility to get started."
            />
          )}
        </section>
      </div>
    </>
  );
}

export function NearbyHospitalsPage() {
  const care = useNearbyCare(true);
  return (
    <>
      <PageHeading
        eyebrow="EXPLORE CARE AROUND YOU"
        title="Nearby hospitals and clinics"
        intro="Browse real places listed on OpenStreetMap. Choose a marker to see details, call a listed number, or open directions."
      />
      <NearbyCareExplorer care={care} />
    </>
  );
}

function PageHeading({ eyebrow, title, intro }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="muted">{intro}</p>
      </div>
    </div>
  );
}

function Field({ label, suffix, ...props }) {
  return (
    <label className="field-label">
      {label}
      <span className="input-wrap">
        <input {...props} />
        {suffix && <small>{suffix}</small>}
      </span>
    </label>
  );
}

function Feedback({ error, message }) {
  return (
    <>
      {error && <div className="notice error-notice">{error}</div>}
      {message && <div className="notice success-notice">{message}</div>}
    </>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
