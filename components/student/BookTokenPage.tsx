import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Priority } from "../../types";

const PRIMARY = "#0A4DBF"; // sidebar + button blue

// Small chevron icon for dropdown
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PRIORITY_OPTIONS: Priority[] = [
  Priority.NORMAL,
  Priority.URGENT,
  Priority.MEDICAL,
];

const BookTokenPage: React.FC = () => {
  const { offices, bookToken } = useAppContext();
  const navigate = useNavigate();

  const [officeId, setOfficeId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [officeOpen, setOfficeOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeOffices = offices.filter((o) => o.isActive);

  // find selected office name
  const selectedOfficeName =
    activeOffices.find((o) => o.id === officeId)?.name || "Choose an office...";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOfficeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeId || !purpose) {
      setError("Please select an office and state your purpose.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await bookToken(officeId, purpose, priority);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to book token. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[75vh] flex flex-col justify-center items-center py-4">
      <div className="w-full max-w-xl">

        <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-md border border-neutral-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OFFICE (custom dropdown) */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Select Office
            </label>

            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setOfficeOpen((o) => !o)}
                className="
                  w-full px-4 py-3 
                  rounded-lg border border-neutral-300 
                  bg-white text-neutral-900 
                  flex items-center justify-between
                  text-sm lg:text-base
                  focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400
                  transition
                "
              >
                <span
                  className={
                    officeId ? "text-neutral-900" : "text-neutral-400"
                  }
                >
                  {selectedOfficeName}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
              </button>

              {officeOpen && (
                <div
                  className="
                    absolute left-0 right-0 mt-2
                    bg-white rounded-xl shadow-lg border border-neutral-200 
                    z-30 max-h-56 overflow-y-auto
                  "
                >
                  {activeOffices.length === 0 && (
                    <div className="px-4 py-3 text-sm text-neutral-500">
                      No active offices available.
                    </div>
                  )}

                  {activeOffices.map((office) => (
                    <button
                      key={office.id}
                      type="button"
                      onClick={() => {
                        setOfficeId(office.id);
                        setOfficeOpen(false);
                      }}
                      className={`
                        w-full text-left px-4 py-2 text-sm
                        ${
                          officeId === office.id
                            ? "bg-blue-50 text-[color:var(--primary)] font-semibold"
                            : "text-neutral-800 hover:bg-neutral-50"
                        }
                      `}
                      style={
                        officeId === office.id
                          ? { color: PRIMARY }
                          : undefined
                      }
                    >
                      {office.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PURPOSE */}
          <div>
            <label
              htmlFor="purpose"
              className="block text-sm font-semibold text-neutral-700 mb-2"
            >
              Purpose of Visit
            </label>
            <input
              id="purpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Fee Payment, Transcript Request"
              className="
                w-full px-4 py-3 
                rounded-lg border border-neutral-300 
                bg-white text-neutral-900 
                text-sm lg:text-base
                focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400
                transition
              "
            />
          </div>

          {/* PRIORITY */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    py-2 rounded-lg text-sm font-medium border transition
                    ${
                      priority === p
                        ? "text-white border-transparent"
                        : "border-neutral-300 text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
                    }
                  `}
                  style={
                    priority === p
                      ? { backgroundColor: PRIMARY }
                      : undefined
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: PRIMARY }}
              className="
                w-full text-white font-semibold py-3 
                rounded-lg shadow-md 
                hover:opacity-90 transition 
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? "Booking..." : "Get Token"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default BookTokenPage;
