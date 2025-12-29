import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export type UserRole = 'admin' | 'producao' | 'financeiro';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  created_at: string;
  last_login?: string;
}

const roleLabels: Record<UserRole, string> = {
  'admin': 'Administrador',
  'producao': 'Produção',
  'financeiro': 'Financeiro'
};

const roleColors: Record<UserRole, string> = {
  'admin': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'producao': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'financeiro': 'bg-green-500/20 text-green-400 border-green-500/30'
};

export default function Usuarios() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'producao' as UserRole
  });
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      // Verificar se o usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Este email já está cadastrado');
      }

      // Para criar usuário via interface, usamos uma abordagem simplificada:
      // O usuário será criado apenas na tabela users, e depois precisará se registrar
      // Ou o admin pode usar o script npm run create-user
      
      alert(`⚠️ IMPORTANTE: A criação via interface está limitada.\n\nPara criar usuário com autenticação completa, use:\n\n1. Script (Recomendado): npm run create-user\n2. Ou peça ao usuário para se registrar em /registro\n\nApós o registro, você pode alterar o perfil deste usuário aqui.`);

      // Por enquanto, não criamos nada via interface
      // O admin deve usar o script para criar usuários completos
      
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'producao'
      });
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      alert(`Erro: ${error.message || 'Tente novamente.'}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setLoadingAction(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          role: formData.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Nota: Para atualizar senha, seria necessário uma Edge Function
      // Por enquanto, informamos que a senha precisa ser alterada pelo próprio usuário
      if (formData.password) {
        alert('A senha foi atualizada no banco. O usuário precisará usar "Recuperar Senha" para definir uma nova senha.');
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'producao'
      });
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      alert(`Erro ao atualizar usuário: ${error.message || 'Tente novamente.'}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userEmail}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Deletar da tabela users
      // Nota: Para deletar do Auth também, seria necessário uma Edge Function
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) throw dbError;

      loadUsers();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      alert(`Erro ao deletar usuário: ${error.message || 'Tente novamente.'}`);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'todos' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Verificar se o usuário tem permissão
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-gray-400">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando usuários...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const stats = [
    { label: 'Total de Usuários', value: users.length, icon: 'ri-user-line', color: 'from-primary-teal to-primary-brown' },
    { label: 'Administradores', value: users.filter(u => u.role === 'admin').length, icon: 'ri-shield-user-line', color: 'from-purple-500 to-purple-700' },
    { label: 'Produção', value: users.filter(u => u.role === 'producao').length, icon: 'ri-music-2-line', color: 'from-blue-500 to-blue-700' },
    { label: 'Financeiro', value: users.filter(u => u.role === 'financeiro').length, icon: 'ri-money-dollar-circle-line', color: 'from-green-500 to-green-700' },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Usuários e Acessos</h1>
            <p className="text-gray-400">Gerencie usuários e permissões do sistema</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'producao'
              });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-user-add-line text-xl"></i>
            Novo Usuário
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-2xl text-white`}></i>
                </div>
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'admin', 'producao', 'financeiro'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterRole === role
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {role === 'todos' ? 'Todos' : roleLabels[role]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Perfil</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Criado em</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src="/favicon com gradiente.png" 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-smooth cursor-pointer"
                          title="Editar"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </button>
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer"
                            title="Excluir"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-user-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum usuário encontrado</p>
          </div>
        )}

        {/* Modal Criar/Editar Usuário */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      role: 'producao'
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={editingUser ? (e) => { e.preventDefault(); handleUpdateUser(); } : handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="usuario@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder={editingUser ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'}
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Perfil de Acesso</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="admin">Administrador</option>
                    <option value="producao">Produção</option>
                    <option value="financeiro">Financeiro</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.role === 'admin' && 'Acesso completo ao sistema'}
                    {formData.role === 'producao' && 'Acesso a artistas, projetos, lançamentos e documentos'}
                    {formData.role === 'financeiro' && 'Acesso a orçamentos e financeiro'}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      setFormData({
                        name: '',
                        email: '',
                        password: '',
                        role: 'producao'
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingAction ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Processando...
                      </>
                    ) : (
                      editingUser ? 'Salvar Alterações' : 'Criar Usuário'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

