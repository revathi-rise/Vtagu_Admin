import React, { useState, useEffect } from 'react';
import { userService, User, UserListResponse } from '@/services/userService';
import { DataTable } from '@/components/ui/DataTable';

/**
 * Example Page Component: Users Management
 * This demonstrates how to integrate the User Service in a page
 */
export default function UsersPageExample() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sortBy: 'user_id',
    sortOrder: 'DESC',
  });

  // Fetch users on mount or when filters/pagination change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response: UserListResponse = await userService.getAll(
          pagination.page,
          pagination.limit,
          filters.search || undefined,
          filters.status || undefined,
          filters.sortBy,
          filters.sortOrder
        );

        setData(response.data);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.page, pagination.limit, filters]);

  // Handle search
  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Handle delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.delete(userId);
      // Refetch data
      setData((prev) => prev.filter((user) => user.user_id !== userId));
    } catch (err) {
      alert('Failed to delete user: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Table columns
  const columns = [
    { header: 'ID', accessorKey: 'user_id' },
    { header: 'Name', accessorKey: 'user_name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Mobile', accessorKey: 'mobile' },
    { header: 'Plan', accessorKey: 'plan' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Created At', accessorKey: 'created_at' },
    {
      header: 'Actions',
      render: (user: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => console.log('Edit user:', user.user_id)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteUser(user.user_id)}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage all users in the system</p>
        </div>
        <button className="bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-600">
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-border rounded-lg"
        />
        <select
          value={filters.status}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="p-4 text-center">Loading users...</div>
      ) : (
        <>
          <DataTable columns={columns} data={data} />

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div>
              Showing {data.length} of {pagination.total} users (Page {pagination.page} of{' '}
              {pagination.pages})
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
