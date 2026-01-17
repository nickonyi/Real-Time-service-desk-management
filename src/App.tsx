import { useState } from "react";
import { TicketWithRelations } from "./lib/supabase";
import Dashboard from "./components/Dashboard";
import TicketList from "./components/TicketList";
import TicketForm from "./components/TicketForm";
import TicketDetail from "./components/TicketDetail";
import Reports from "./components/Reports";
import { LayoutDashboard, List, FileText, Plus } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "tickets" | "reports"
  >("dashboard");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] =
    useState<TicketWithRelations | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTicketCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTicketUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Desk</h1>
              <p className="text-sm text-gray-600">
                Real-time ticket tracking & reporting
              </p>
            </div>
            <button
              onClick={() => setShowTicketForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              New Ticket
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "tickets"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <List size={18} />
              All Tickets
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "reports"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText size={18} />
              Reports
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <Dashboard refreshTrigger={refreshTrigger} />
        )}
        {activeTab === "tickets" && (
          <TicketList
            onTicketClick={setSelectedTicket}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === "reports" && <Reports refreshTrigger={refreshTrigger} />}
      </main>

      {showTicketForm && (
        <TicketForm
          onClose={() => setShowTicketForm(false)}
          onSuccess={handleTicketCreated}
        />
      )}

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdated}
        />
      )}
    </div>
  );
}

export default App;
