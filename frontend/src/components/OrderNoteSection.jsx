import { useState } from "react";
import { MessageSquareText, X } from "lucide-react";

const noteSuggestions = [
  "Less spicy 🌶️",
  "Add extra onions 🧅",
  "Please deliver fast ⏳",
  "Extra spicy fire mode 🔥",
  "Don’t ring the bell 🔕",
  "Extra napkins please 🧻",
  "Send ketchup & mayo 🍅",
  "Avoid too much oil 🥗",
  "Need tissues please 🤧",
  "Birthday surprise delivery 🎉",
];

export default function OrderNoteSection({ orderNote, setOrderNote }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPopup(true)}
        className="w-full flex items-center justify-between p-4 my-2 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center min-w-[42px] h-[42px] rounded-full bg-green-100 dark:bg-green-900/30">
            <MessageSquareText className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>

          <div className="flex flex-col text-left min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              Add Order Note
            </h3>

            {orderNote ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                {orderNote}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Cooking or delivery instructions
              </p>
            )}
          </div>
        </div>

        {orderNote && (
          <div className="ml-3 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
            <span className="text-[11px] font-medium text-green-700 dark:text-green-300">
              Added
            </span>
          </div>
        )}
      </button>

      {showPopup && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center pb-16">
          <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-5 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Add Order Note
              </h2>

              <button
                onClick={() => setShowPopup(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={4}
              maxLength={250}
              placeholder="Write your instructions here..."
              className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />

            <div className="flex flex-wrap gap-2 mt-4">
              {noteSuggestions.map((note, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setOrderNote(note)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 hover:scale-105 transition"
                >
                  {note}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-gray-400">{orderNote.length}/250</p>

              <button
                onClick={() => setShowPopup(false)}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
