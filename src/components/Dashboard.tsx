import { useState, useEffect } from 'react';
import { supabase, TicketWithRelations } from '../lib/supabase';
import { BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  refreshTrigger: number;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byCategory: { [key: string]: number };
  byPriority: { [key: string]: number };
  avgResolutionTime: string;
}

export default function Dashboard({ refreshTrigger }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    byCategory: {},
    byPriority: {},
    avgResolutionTime: 'N/A',
  });
  const [recentTickets, setRecentTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    setLoading(true);

    const { data: tickets } = await supabase
      .from('tickets')
      .select(`
        *,
        categories (*),
        priorities (*),
        statuses (*)
      `)
      .order('created_at', { ascending: false });

    if (tickets) {
      const total = tickets.length;
      const open = tickets.filter((t) => t.statuses.name === 'Open').length;
      const inProgress = tickets.filter((t) => t.statuses.name === 'In Progress').length;
      const resolved = tickets.filter((t) => t.statuses.name === 'Resolved').length;
      const closed = tickets.filter((t) => t.statuses.name === 'Closed').length;

      const byCategory: { [key: string]: number } = {};
      const byPriority: { [key: string]: number } = {};

      tickets.forEach((ticket) => {
        const catName = ticket.categories.name;
        const priName = ticket.priorities.name;
        byCategory[catName] = (byCategory[catName] || 0) + 1;
        byPriority[priName] = (byPriority[priName] || 0) + 1;
      });

      const resolvedTickets = tickets.filter((t) => t.resolved_at);
      let avgResolutionTime = 'N/A';

      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at).getTime();
          const resolved = new Date(ticket.resolved_at!).getTime();
          return sum + (resolved - created);
        }, 0);

        const avgMilliseconds = totalTime / resolvedTickets.length;
        const avgHours = Math.round(avgMilliseconds / (1000 * 60 * 60));
        avgResolutionTime = `${avgHours} hours`;
      }

      setStats({
        total,
        open,
        inProgress,
        resolved,
        closed,
        byCategory,
        byPriority,
        avgResolutionTime,
      });

      setRecentTickets(tickets.slice(0, 5));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Open Tickets</p>
              <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Tickets by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{category}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Tickets by Priority
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byPriority).map(([priority, count]) => {
              const color =
                priority === 'Critical'
                  ? 'bg-red-600'
                  : priority === 'High'
                  ? 'bg-orange-600'
                  : priority === 'Medium'
                  ? 'bg-yellow-600'
                  : 'bg-green-600';

              return (
                <div key={priority}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{priority}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all`}
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-blue-600 pl-4">
            <p className="text-sm text-gray-600">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgResolutionTime}</p>
          </div>
          <div className="border-l-4 border-green-600 pl-4">
            <p className="text-sm text-gray-600">Resolution Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0}%
            </p>
          </div>
          <div className="border-l-4 border-orange-600 pl-4">
            <p className="text-sm text-gray-600">Active Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.open + stats.inProgress}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tickets</h3>
        <div className="space-y-3">
          {recentTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{ticket.ticket_number}</p>
                <p className="text-sm text-gray-600">{ticket.title}</p>
              </div>
              <span
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${ticket.statuses.color}20`,
                  color: ticket.statuses.color,
                }}
              >
                {ticket.statuses.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
