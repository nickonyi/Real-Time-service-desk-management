import { useState, useEffect } from 'react';
import { supabase, TicketWithRelations, Status, TicketComment } from '../lib/supabase';
import { X, Clock, User, Mail, Tag, AlertCircle, MessageSquare, Send } from 'lucide-react';

interface TicketDetailProps {
  ticket: TicketWithRelations;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TicketDetail({ ticket, onClose, onUpdate }: TicketDetailProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to || '');
  const [currentStatus, setCurrentStatus] = useState(ticket.status_id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatuses();
    loadComments();
  }, []);

  const loadStatuses = async () => {
    const { data } = await supabase.from('statuses').select('*').order('order');
    if (data) setStatuses(data);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const handleStatusChange = async (newStatusId: string) => {
    setLoading(true);
    const newStatus = statuses.find((s) => s.id === newStatusId);
    const updates: any = { status_id: newStatusId };

    if (newStatus?.name === 'Resolved' && !ticket.resolved_at) {
      updates.resolved_at = new Date().toISOString();
    }

    if (newStatus?.is_closed && !ticket.closed_at) {
      updates.closed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('tickets').update(updates).eq('id', ticket.id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      setCurrentStatus(newStatusId);
      onUpdate();
    }
    setLoading(false);
  };

  const handleAssignmentChange = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to: assignedTo })
      .eq('id', ticket.id);

    if (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
    } else {
      onUpdate();
    }
    setLoading(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthor.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('ticket_comments').insert([
      {
        ticket_id: ticket.id,
        comment: newComment,
        author_name: commentAuthor,
        is_internal: false,
      },
    ]);

    if (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } else {
      setNewComment('');
      loadComments();
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{ticket.ticket_number}</h2>
            <p className="text-sm text-gray-600">{ticket.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter name"
                  />
                  <button
                    onClick={handleAssignmentChange}
                    disabled={loading || assignedTo === ticket.assigned_to}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Tag size={16} className="text-gray-400" />
                <span
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: `${ticket.categories.color}20`,
                    color: ticket.categories.color,
                  }}
                >
                  {ticket.categories.name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <AlertCircle size={16} className="text-gray-400" />
                <span
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: `${ticket.priorities.color}20`,
                    color: ticket.priorities.color,
                  }}
                >
                  {ticket.priorities.name}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-700">Requester:</span>
                <span className="font-medium text-gray-900">{ticket.requester_name}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-700">Email:</span>
                <a
                  href={`mailto:${ticket.requester_email}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {ticket.requester_email}
                </a>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-700">Created:</span>
                <span className="font-medium text-gray-900">{formatDate(ticket.created_at)}</span>
              </div>

              {ticket.resolved_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-700">Resolved:</span>
                  <span className="font-medium text-gray-900">{formatDate(ticket.resolved_at)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="mr-2" size={20} />
              Comments ({comments.length})
            </h3>

            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{comment.author_name}</span>
                    <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-4">No comments yet</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="space-y-3">
              <input
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim() || !commentAuthor.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
                Add Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
