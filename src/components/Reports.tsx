import { useState, useEffect } from 'react';
import { supabase, TicketWithRelations } from '../lib/supabase';
import { Download, Calendar, FileText, TrendingUp } from 'lucide-react';

interface ReportsProps {
  refreshTrigger: number;
}

export default function Reports({ refreshTrigger }: ReportsProps) {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, [refreshTrigger]);

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select(`
        *,
        categories (*),
        priorities (*),
        statuses (*)
      `)
      .order('created_at', { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  };

  const filterTicketsByDate = () => {
    if (!startDate && !endDate) return tickets;

    return tickets.filter((ticket) => {
      const ticketDate = new Date(ticket.created_at);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        return ticketDate >= start && ticketDate <= end;
      } else if (start) {
        return ticketDate >= start;
      } else if (end) {
        return ticketDate <= end;
      }
      return true;
    });
  };

  const exportToCSV = () => {
    const filteredTickets = filterTicketsByDate();

    const headers = [
      'Ticket Number',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Status',
      'Requester Name',
      'Requester Email',
      'Assigned To',
      'Created At',
      'Updated At',
      'Resolved At',
      'Closed At',
    ];

    const rows = filteredTickets.map((ticket) => [
      ticket.ticket_number,
      ticket.title,
      ticket.description,
      ticket.categories.name,
      ticket.priorities.name,
      ticket.statuses.name,
      ticket.requester_name,
      ticket.requester_email,
      ticket.assigned_to,
      ticket.created_at,
      ticket.updated_at,
      ticket.resolved_at || '',
      ticket.closed_at || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `service-desk-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTickets = filterTicketsByDate();

  const calculateMetrics = () => {
    const total = filteredTickets.length;
    const resolved = filteredTickets.filter((t) => t.resolved_at).length;
    const closed = filteredTickets.filter((t) => t.closed_at).length;
    const open = filteredTickets.filter((t) => t.statuses.name === 'Open').length;
    const inProgress = filteredTickets.filter((t) => t.statuses.name === 'In Progress').length;

    const resolvedTickets = filteredTickets.filter((t) => t.resolved_at);
    let avgResolutionHours = 0;

    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at).getTime();
        const resolved = new Date(ticket.resolved_at!).getTime();
        return sum + (resolved - created);
      }, 0);
      avgResolutionHours = Math.round(totalTime / (1000 * 60 * 60 * resolvedTickets.length));
    }

    const byCategory: { [key: string]: number } = {};
    const byPriority: { [key: string]: number } = {};

    filteredTickets.forEach((ticket) => {
      byCategory[ticket.categories.name] = (byCategory[ticket.categories.name] || 0) + 1;
      byPriority[ticket.priorities.name] = (byPriority[ticket.priorities.name] || 0) + 1;
    });

    return {
      total,
      resolved,
      closed,
      open,
      inProgress,
      avgResolutionHours,
      byCategory,
      byPriority,
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="mr-2" size={24} />
          Generate Report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Export to CSV
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing data for {filteredTickets.length} tickets
          {(startDate || endDate) && (
            <span className="ml-2">
              {startDate && `from ${startDate}`}
              {startDate && endDate && ' '}
              {endDate && `to ${endDate}`}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{metrics.resolved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-orange-600">{metrics.open + metrics.inProgress}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Resolution</p>
              <p className="text-3xl font-bold text-blue-600">
                {metrics.avgResolutionHours > 0 ? `${metrics.avgResolutionHours}h` : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by Category</h3>
          <div className="space-y-3">
            {Object.entries(metrics.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-700">{category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / metrics.total) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by Priority</h3>
          <div className="space-y-3">
            {Object.entries(metrics.byPriority)
              .sort(([, a], [, b]) => b - a)
              .map(([priority, count]) => {
                const color =
                  priority === 'Critical'
                    ? 'bg-red-600'
                    : priority === 'High'
                    ? 'bg-orange-600'
                    : priority === 'Medium'
                    ? 'bg-yellow-600'
                    : 'bg-green-600';

                return (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-gray-700">{priority}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full`}
                          style={{ width: `${(count / metrics.total) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border-l-4 border-green-600 pl-4">
            <p className="text-sm text-gray-600">Resolution Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0}%
            </p>
          </div>
          <div className="border-l-4 border-blue-600 pl-4">
            <p className="text-sm text-gray-600">Closure Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.total > 0 ? Math.round((metrics.closed / metrics.total) * 100) : 0}%
            </p>
          </div>
          <div className="border-l-4 border-orange-600 pl-4">
            <p className="text-sm text-gray-600">Open Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.open}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
