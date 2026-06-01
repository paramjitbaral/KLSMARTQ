
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, Role } from '../../types';
import { EditIcon, TrashIcon, EyeIcon, EyeOffIcon } from '../common/Icons';

// FIX: Update onSave prop to correctly handle the password field for new users.
const UserForm: React.FC<{ user?: User; onSave: (user: (Omit<User, 'id'> & { password?: string }) | User) => Promise<void>; onCancel: () => void; onDelete?: () => void }> = ({ user, onSave, onCancel, onDelete }) => {
    const { offices } = useAppContext();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        universityId: user?.universityId || '',
        role: user?.role || Role.STAFF,
        assignedOfficeIds: user?.assignedOfficeIds || [],
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOfficeToggle = (officeId: string) => {
        const newAssignedOfficeIds = formData.assignedOfficeIds.includes(officeId)
            ? formData.assignedOfficeIds.filter(id => id !== officeId)
            : [...formData.assignedOfficeIds, officeId];
        setFormData(prev => ({ ...prev, assignedOfficeIds: newAssignedOfficeIds }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) { // Validation for new user password
            if (!password || !confirmPassword) {
                setError('Password is required.'); return;
            }
            if (password.length < 6) { // Supabase default min length
                setError('Password must be at least 6 characters long.'); return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.'); return;
            }
        }

        // The data structure to be saved, either for a new user or an existing one.
        const dataToSave = user
            ? { ...user, ...formData }
            : { ...formData, password };
        
        // Removed role restriction so Admins can also be assigned offices
        
        setIsSaving(true);
        try {
            await onSave(dataToSave);
            // The parent component handles closing the modal on success
        } catch (err: any) {
            // This robust check ensures that a string is always set as the error, preventing "[object Object]".
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err && err.message && typeof err.message === 'string') {
                setError(err.message);
            } else if (typeof err === 'string') {
                setError(err);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.error("Error saving user:", err); // for debugging
        } finally {
            setIsSaving(false);
        }
    }
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const assignedOfficesDetails = offices.filter(o => formData.assignedOfficeIds.includes(o.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                 <h2 className="text-2xl font-bold mb-6 text-neutral-800">{user ? 'Edit User' : 'Add User'}</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light" required />
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} disabled={!!user} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light disabled:bg-neutral-100" required />
                    
                    {!user && (
                        <>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} placeholder="Temporary Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light pr-10" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700">
                                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative">
                                <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Temporary Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light pr-10" required />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700">
                                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </>
                    )}
                    
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light">
                        <option value={Role.STAFF}>Staff</option>
                        <option value={Role.ADMIN}>Admin</option>
                        <option value={Role.STUDENT}>Student</option>
                    </select>
                    
                    {(formData.role === Role.STAFF || formData.role === Role.ADMIN) && (
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Assigned Offices</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 text-left flex justify-between items-center"
                                    aria-haspopup="listbox"
                                    aria-expanded={isDropdownOpen}
                                >
                                    <div className="flex flex-wrap gap-1 items-center min-h-[24px]">
                                        {assignedOfficesDetails.length > 0 ? (
                                            assignedOfficesDetails.map(office => (
                                                <span key={office.id} className="bg-neutral-200 text-neutral-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                                                    {office.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-neutral-500">Select offices...</span>
                                        )}
                                    </div>
                                    <svg className={`w-4 h-4 text-neutral-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg" role="listbox">
                                        <ul className="max-h-48 overflow-y-auto">
                                            {offices.map(office => (
                                                <li
                                                    key={office.id}
                                                    className="px-4 py-2 hover:bg-neutral-100 cursor-pointer flex items-center"
                                                    onClick={() => handleOfficeToggle(office.id)}
                                                    role="option"
                                                    aria-selected={formData.assignedOfficeIds.includes(office.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.assignedOfficeIds.includes(office.id)}
                                                        readOnly
                                                        className="mr-3 h-4 w-4 rounded border-neutral-300 text-primary-light focus:ring-primary-light cursor-pointer"
                                                    />
                                                    <span className="text-neutral-800">{office.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div className="flex justify-between items-center pt-4">
                        {user && onDelete ? (
                            <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition-colors">Delete</button>
                        ) : <div></div>}
                        <div className="flex space-x-4">
                            <button type="button" onClick={onCancel} className="px-6 py-2 bg-neutral-200 text-neutral-800 font-semibold rounded-lg hover:bg-neutral-300 transition-colors">Cancel</button>
                            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:bg-neutral-400">
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                 </form>
            </div>
        </div>
    )
};

const ConfirmationModal: React.FC<{
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    isDestructive?: boolean;
    isProcessing?: boolean;
}> = ({ title, message, onConfirm, onClose, confirmText = 'Confirm', isDestructive = false, isProcessing = false }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 id="confirmation-title" className="text-xl font-bold text-neutral-800 mb-4">{title}</h2>
                <div className="text-neutral-600 mb-6">{message}</div>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        disabled={isProcessing}
                        className="px-4 py-2 bg-neutral-200 text-neutral-800 font-semibold rounded-lg hover:bg-neutral-300 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={isProcessing}
                        className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors flex items-center justify-center min-w-[100px] ${
                            isDestructive 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-primary hover:bg-primary-light'
                        } disabled:bg-neutral-400 disabled:cursor-wait`}
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


const UserManagementPage: React.FC = () => {
  const { users, offices, addUser, updateUser, deleteUser, currentUser } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');

  const handleSave = async (userData: (Omit<User, 'id'> & { password?: string }) | User) => {
    if ('id' in userData) {
      await updateUser(userData);
    } else {
      await addUser(userData);
    }
    setIsModalOpen(false);
    setEditingUser(undefined);
  };
  
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError('');
    try {
        await deleteUser(userToDelete.id);
        setUserToDelete(null); // Close modal on success
    } catch (e: any) {
        setDeleteError(e.message || 'An unknown error occurred while deleting the user.');
    } finally {
        setIsDeleting(false);
    }
  }
  
  const handleCloseDeleteModal = () => {
      setUserToDelete(null);
      setDeleteError('');
  }

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (roleFilter === 'All') return true;
        return user.role === roleFilter;
      })
      .filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (user.name?.toLowerCase() || '').includes(term) || 
               (user.email?.toLowerCase() || '').includes(term);
      });
  }, [users, searchTerm, roleFilter]);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-xl md:text-3xl font-bold text-neutral-800 leading-tight">User Management</h1>
        <button onClick={() => { setEditingUser(undefined); setIsModalOpen(true); }} className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-primary text-white rounded-lg font-semibold hover:bg-primary-light">Add User</button>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
        <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-2/3 md:w-1/3 px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light"
        />
        <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as Role | 'All')}
            className="w-full sm:w-auto px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light"
        >
            <option value="All">All Roles</option>
            <option value={Role.ADMIN}>Admin</option>
            <option value={Role.STAFF}>Staff</option>
            <option value={Role.STUDENT}>Student</option>
        </select>
      </div>

       {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredUsers.map(user => {
            const assignedOfficeNames = user.assignedOfficeIds?.map(id => offices.find(o => o.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
            return (
                <div key={user.id} className="bg-white rounded-lg shadow-md border border-neutral-200 p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg text-neutral-800">{user.name}</p>
                            <p className="text-sm text-neutral-600">{user.email}</p>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                            <button onClick={() => openEditModal(user)} className="text-neutral-500 hover:text-blue-600 transition-colors" title="Edit User">
                                <EditIcon className="w-5 h-5" />
                            </button>
                            {currentUser?.id !== user.id && (
                               <button onClick={() => setUserToDelete(user)} className="text-neutral-500 hover:text-red-600 transition-colors" title="Delete User">
                                    <TrashIcon className="w-5 h-5" />
                               </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                        <p className="text-sm text-neutral-600"><strong>Role:</strong> {user.role}</p>
                        <p className="text-sm text-neutral-600"><strong>Assigned:</strong> {assignedOfficeNames}</p>
                    </div>
                </div>
            )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden hidden md:block">
        <table className="w-full">
          <thead className="bg-neutral-100">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Name</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Email</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Role</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Assigned Offices</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-neutral-200">
                    <td className="p-4 text-neutral-800">{user.name}</td>
                    <td className="p-4 text-neutral-800">{user.email}</td>
                    <td className="p-4 text-neutral-800">{user.role}</td>
                    <td className="p-4 text-sm text-neutral-700">{user.assignedOfficeIds?.map(id => offices.find(o => o.id === id)?.name).join(', ') || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-4">
                        <button onClick={() => openEditModal(user)} className="text-neutral-500 hover:text-blue-600 transition-colors" title="Edit User">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        {currentUser?.id !== user.id && (
                            <button onClick={() => setUserToDelete(user)} className="text-neutral-500 hover:text-red-600 transition-colors" title="Delete User">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-neutral-500">
                        No users found matching your criteria.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
       {isModalOpen && <UserForm user={editingUser} onSave={handleSave} onCancel={() => setIsModalOpen(false)} onDelete={editingUser ? () => { setIsModalOpen(false); setUserToDelete(editingUser); } : undefined} />}
       {userToDelete && (
            <ConfirmationModal
                title="Confirm Deletion"
                message={
                    <>
                        <p>Are you sure you want to delete the user <strong className="text-neutral-800">{userToDelete.name}</strong>? This requires a configured backend function and cannot be undone.</p>
                        {deleteError && (
                           <div className="mt-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm" role="alert">
                                {deleteError}
                           </div>
                        )}
                    </>
                }
                onConfirm={handleConfirmDelete}
                onClose={handleCloseDeleteModal}
                confirmText="Delete"
                isDestructive={true}
                isProcessing={isDeleting}
            />
        )}
    </div>
  );
};

export default UserManagementPage;
