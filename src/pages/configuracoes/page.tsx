import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { UserRole } from '../../contexts/AuthContext';

type TabType = 'usuarios' | 'pendentes' | 'convites' | 'configuracoes';

export default function Configuracoes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('usuarios');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosPendentes, setUsuariosPendentes] = useState<any[]>([]);
  const [convites, setConvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPendentes, setLoadingPendentes] = useState(false);
  const [loadingConvites, setLoadingConvites] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
  const [selectedPendente, setSelectedPendente] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos');
  
  const [inviteFormData, setInviteFormData] = useState({
    expiresDays: 7,
    maxUses: 1,
  });

  const [approveFormData, setApproveFormData] = useState({
    role: 'operador' as UserRole,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operador' as UserRole,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'operador' as UserRole,
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsuarios();
      if (activeTab === 'pendentes') {
        loadUsuariosPendentes();
      }
      if (activeTab === 'convites') {
        loadConvites();
      }
    }
  }, [isAdmin, activeTab]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsuariosPendentes = async () => {
    try {
      setLoadingPendentes(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setUsuariosPendentes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários pendentes:', error);
      setUsuariosPendentes([]);
    } finally {
      setLoadingPendentes(false);
    }
  };

  const loadConvites = async () => {
    try {
      setLoadingConvites(true);
      const { data, error } = await supabase
        .from('user_invites')
        .select(`
          *,
          created_by_user:users!user_invites_created_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Processar dados para garantir que created_by_user esteja disponível
        const processedData = data.map(convite => ({
          ...convite,
          created_by_user: convite.created_by_user || { name: 'N/A', email: 'N/A' }
        }));
        setConvites(processedData);
      }
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
      // Tentar carregar sem o join se houver erro
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_invites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!fallbackError && fallbackData) {
        const processedData = fallbackData.map(convite => ({
          ...convite,
          created_by_user: { name: 'N/A', email: 'N/A' }
        }));
        setConvites(processedData);
      } else {
        setConvites([]);
      }
    } finally {
      setLoadingConvites(false);
    }
  };

  const generateInviteToken = () => {
    // Gerar token aleatório de 32 caracteres usando crypto API
    const array = new Uint8Array(24);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback para ambientes sem crypto API
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 32);
    return token;
  };

  const handleCreateInvite = async () => {
    try {
      if (!user?.id) {
        alert('Erro: Usuário não identificado.');
        return;
      }

      const token = generateInviteToken();
      const expiresAt = inviteFormData.expiresDays > 0
        ? new Date(Date.now() + inviteFormData.expiresDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('user_invites')
        .insert({
          token,
          created_by: user.id,
          expires_at: expiresAt,
          max_uses: inviteFormData.maxUses,
          current_uses: 0,
        });

      if (error) throw error;

      await loadConvites();
      setShowInviteModal(false);
      setInviteFormData({ expiresDays: 7, maxUses: 1 });
      
      // Mostrar link gerado
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/registro/${token}`;
      alert(`Link de convite gerado com sucesso!\n\n${inviteLink}\n\nCopie e compartilhe este link.`);
    } catch (error: any) {
      console.error('Erro ao criar convite:', error);
      alert(`Erro ao criar convite: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleApproveUser = async () => {
    if (!selectedPendente) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'approved',
          role: approveFormData.role,
        })
        .eq('id', selectedPendente.id);

      if (error) throw error;

      await loadUsuariosPendentes();
      await loadUsuarios();
      setShowApproveModal(false);
      setSelectedPendente(null);
      setApproveFormData({ role: 'operador' });
      alert('Usuário aprovado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao aprovar usuário:', error);
      alert(`Erro ao aprovar usuário: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'rejected',
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsuariosPendentes();
      alert('Cadastro rejeitado.');
    } catch (error: any) {
      console.error('Erro ao rejeitar usuário:', error);
      alert(`Erro ao rejeitar usuário: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const copyInviteLink = (token: string) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/registro/${token}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Link copiado para a área de transferência!');
  };

  const deleteInvite = async (inviteId: string) => {
    if (!confirm('Tem certeza que deseja excluir este convite?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      await loadConvites();
      alert('Convite excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir convite:', error);
      alert(`Erro ao excluir convite: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      if (formData.password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim()
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: authData.user.id,
            name: formData.name.trim(),
            email: formData.email.trim(),
            role: formData.role,
            status: 'approved',
            avatar: null
          }], {
            onConflict: 'id'
          });

        if (profileError) throw profileError;

        await loadUsuarios();
        setShowModal(false);
        resetForm();
        alert('Usuário criado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      alert(`Erro ao criar usuário: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsuario) return;

    try {
      if (!editFormData.name.trim() || !editFormData.email.trim()) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Atualizar perfil na tabela users
      const { error } = await supabase
        .from('users')
        .update({
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          role: editFormData.role,
        })
        .eq('id', selectedUsuario.id);

      if (error) throw error;

      // Nota: Atualização de email no Auth requer confirmação do novo email
      // Por enquanto, apenas atualizamos na tabela users
      // O email no Auth pode ser atualizado pelo próprio usuário através do perfil

      await loadUsuarios();
      setShowEditModal(false);
      setSelectedUsuario(null);
      alert('Usuário atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      alert(`Erro ao atualizar usuário: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?\n\n⚠️ ATENÇÃO: Esta ação removerá o perfil do usuário do sistema, mas a conta de autenticação precisará ser excluída manualmente no Supabase Dashboard se necessário.')) {
      return;
    }

    try {
      // Excluir da tabela users
      // Nota: A exclusão da conta de autenticação no Supabase Auth requer Admin API
      // que não está disponível no cliente. O perfil será removido, mas a conta Auth permanecerá.
      // Para excluir completamente, use o Supabase Dashboard ou uma função serverless.
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await loadUsuarios();
      alert('Perfil do usuário excluído com sucesso!\n\nNota: A conta de autenticação ainda existe no Supabase. Para excluí-la completamente, use o Supabase Dashboard.');
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      alert(`Erro ao excluir usuário: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleEditUser = (usuario: any) => {
    setSelectedUsuario(usuario);
    setEditFormData({
      name: usuario.name || '',
      email: usuario.email || '',
      role: usuario.role || 'operador',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'operador',
    });
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: { [key in UserRole]: string } = {
      admin: 'Administrador',
      executivo: 'Executivo',
      ar: 'A&R',
      producao: 'Produção',
      financeiro: 'Financeiro',
      viewer: 'Visualizador',
      operador: 'Operador',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: UserRole) => {
    const colors: { [key in UserRole]: string } = {
      admin: 'bg-purple-500/20 text-purple-400',
      executivo: 'bg-blue-500/20 text-blue-400',
      ar: 'bg-green-500/20 text-green-400',
      producao: 'bg-yellow-500/20 text-yellow-400',
      financeiro: 'bg-orange-500/20 text-orange-400',
      viewer: 'bg-gray-500/20 text-gray-400',
      operador: 'bg-primary-teal/20 text-primary-teal',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-400';
  };

  // Apenas admin e operador estão disponíveis para criação/edição
  const availableRoles: UserRole[] = ['admin', 'operador'];

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'todos' || u.role === filterRole;

    return matchesSearch && matchesRole;
  });

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <i className="ri-shield-cross-line text-6xl text-red-400 mb-4"></i>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
            <p className="text-gray-400">Apenas administradores podem acessar esta página.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Configurações</h1>
            <p className="text-gray-400">Gerencie usuários e configurações do sistema</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 ${
                activeTab === 'usuarios'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <i className="ri-user-line"></i>
              <span>Usuários Aprovados</span>
            </button>
            <button
              onClick={() => setActiveTab('pendentes')}
              className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 relative ${
                activeTab === 'pendentes'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <i className="ri-user-add-line"></i>
              <span>Usuários Pendentes</span>
              {usuariosPendentes.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {usuariosPendentes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('convites')}
              className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 ${
                activeTab === 'convites'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <i className="ri-link"></i>
              <span>Links Compartilháveis</span>
            </button>
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 ${
                activeTab === 'configuracoes'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <i className="ri-settings-3-line"></i>
              <span>Configurações Gerais</span>
            </button>
          </div>
        </div>

        {/* Tab: Usuários */}
        {activeTab === 'usuarios' && (
          <>
            {/* Filtros e Busca */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <i className="ri-search-line mr-2"></i>Buscar
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <i className="ri-user-settings-line mr-2"></i>Filtrar por Perfil
                  </label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as UserRole | 'todos')}
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="todos">Todos os perfis</option>
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="ri-user-add-line text-lg"></i>
                    <span>Novo Usuário</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Usuários */}
            {loading ? (
              <div className="text-center py-12">
                <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
                <p className="text-gray-400">Carregando usuários...</p>
              </div>
            ) : (
              <>
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-hover">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Perfil</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado em</th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {filteredUsuarios.map((usuario) => (
                          <tr key={usuario.id} className="hover:bg-dark-hover transition-smooth">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {usuario.name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{usuario.name}</div>
                                  {usuario.id === user?.id && (
                                    <div className="text-xs text-primary-teal">Você</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{usuario.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-lg ${getRoleColor(usuario.role)}`}>
                                {getRoleLabel(usuario.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-400">
                                {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditUser(usuario)}
                                  className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                                  title="Editar"
                                >
                                  <i className="ri-edit-line text-lg"></i>
                                </button>
                                {usuario.id !== user?.id && (
                                  <button
                                    onClick={() => handleDeleteUser(usuario.id)}
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

                {filteredUsuarios.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-user-line text-6xl text-gray-600 mb-4"></i>
                    <p className="text-gray-400">Nenhum usuário encontrado</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Usuários Pendentes */}
        {activeTab === 'pendentes' && (
          <>
            {loadingPendentes ? (
              <div className="text-center py-12">
                <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
                <p className="text-gray-400">Carregando usuários pendentes...</p>
              </div>
            ) : (
              <>
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-hover">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data de Cadastro</th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {usuariosPendentes.map((usuario) => (
                          <tr key={usuario.id} className="hover:bg-dark-hover transition-smooth">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                  <span className="text-sm font-bold text-yellow-400">
                                    {usuario.name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{usuario.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{usuario.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-400">
                                {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedPendente(usuario);
                                    setApproveFormData({ role: usuario.role || 'operador' });
                                    setShowApproveModal(true);
                                  }}
                                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-smooth cursor-pointer flex items-center gap-2"
                                  title="Aprovar"
                                >
                                  <i className="ri-check-line"></i>
                                  <span>Aprovar</span>
                                </button>
                                <button
                                  onClick={() => handleRejectUser(usuario.id)}
                                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-smooth cursor-pointer flex items-center gap-2"
                                  title="Rejeitar"
                                >
                                  <i className="ri-close-line"></i>
                                  <span>Rejeitar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {usuariosPendentes.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-user-add-line text-6xl text-gray-600 mb-4"></i>
                    <p className="text-gray-400">Nenhum usuário pendente</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Links Compartilháveis */}
        {activeTab === 'convites' && (
          <>
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2"
              >
                <i className="ri-add-line text-lg"></i>
                <span>Gerar Novo Link</span>
              </button>
            </div>

            {loadingConvites ? (
              <div className="text-center py-12">
                <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
                <p className="text-gray-400">Carregando convites...</p>
              </div>
            ) : (
              <>
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-hover">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Token</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado por</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expira em</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Uso</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {convites.map((convite) => {
                          const baseUrl = window.location.origin;
                          const inviteLink = `${baseUrl}/registro/${convite.token}`;
                          const isExpired = convite.expires_at && new Date(convite.expires_at) < new Date();
                          const isUsed = convite.used_at !== null;
                          const isMaxUses = convite.current_uses >= convite.max_uses;
                          const isValid = !isExpired && !isUsed && !isMaxUses;

                          return (
                            <tr key={convite.id} className="hover:bg-dark-hover transition-smooth">
                              <td className="px-6 py-4">
                                <div className="text-sm font-mono text-white break-all">{convite.token}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-400">
                                  {convite.created_by_user?.name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-400">
                                  {convite.expires_at 
                                    ? new Date(convite.expires_at).toLocaleDateString('pt-BR')
                                    : 'Sem expiração'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">
                                  {convite.current_uses} / {convite.max_uses}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-lg ${
                                  isValid 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {isValid ? 'Válido' : isUsed ? 'Usado' : isExpired ? 'Expirado' : 'Esgotado'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {isValid && (
                                    <button
                                      onClick={() => copyInviteLink(convite.token)}
                                      className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                                      title="Copiar link"
                                    >
                                      <i className="ri-file-copy-line text-lg"></i>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteInvite(convite.id)}
                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer"
                                    title="Excluir"
                                  >
                                    <i className="ri-delete-bin-line text-lg"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {convites.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-link text-6xl text-gray-600 mb-4"></i>
                    <p className="text-gray-400">Nenhum link compartilhável criado</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Configurações Gerais */}
        {activeTab === 'configuracoes' && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Configurações Gerais do Sistema</h2>
            
            <div className="space-y-6">
              {/* Seção de Informações da Gravadora */}
              <div className="border-b border-dark-border pb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-building-line text-primary-teal"></i>
                  Informações da Gravadora
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Gravadora</label>
                    <input
                      type="text"
                      defaultValue="CEU Music"
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">CNPJ</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Endereço</label>
                    <input
                      type="text"
                      placeholder="Endereço completo"
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Integrações */}
              <div className="border-b border-dark-border pb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-plug-line text-primary-teal"></i>
                  Integrações
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="ri-youtube-line text-2xl text-red-400"></i>
                      <div>
                        <p className="text-white font-medium">YouTube</p>
                        <p className="text-xs text-gray-400">Upload desativado (substituído por Cloudflare Stream)</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs rounded-lg bg-gray-500/20 text-gray-300">
                      Desativado
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="ri-cloud-line text-2xl text-primary-teal"></i>
                      <div>
                        <p className="text-white font-medium">Cloudflare R2</p>
                        <p className="text-xs text-gray-400">Armazenamento de arquivos</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs rounded-lg bg-green-500/20 text-green-400">
                      Conectado
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção de Backup */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-database-2-line text-primary-teal"></i>
                  Backup e Segurança
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                    <div>
                      <p className="text-white font-medium">Último Backup</p>
                      <p className="text-xs text-gray-400">Backup automático do banco de dados</p>
                    </div>
                    <button className="px-4 py-2 bg-primary-teal/20 hover:bg-primary-teal/30 text-primary-teal rounded-lg transition-smooth cursor-pointer text-sm">
                      Fazer Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Criar Usuário */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Usuário</h2>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome *</label>
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Senha *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Perfil *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Usuário */}
        {showEditModal && selectedUsuario && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Editar Usuário</h2>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUsuario(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Perfil *</label>
                  <select
                    required
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-400">
                    <i className="ri-information-line mr-1"></i>
                    Para alterar a senha, o usuário deve usar a funcionalidade de recuperação de senha.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUsuario(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Aprovar Usuário */}
        {showApproveModal && selectedPendente && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Aprovar Usuário</h2>
                <button 
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedPendente(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="mb-6 p-4 bg-dark-bg rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Usuário:</p>
                <p className="text-white font-medium">{selectedPendente.name}</p>
                <p className="text-sm text-gray-400 mt-1">{selectedPendente.email}</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleApproveUser(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Perfil *</label>
                  <select
                    required
                    value={approveFormData.role}
                    onChange={(e) => setApproveFormData({ ...approveFormData, role: e.target.value as UserRole })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    {(['admin', 'executivo', 'ar', 'producao', 'financeiro', 'operador', 'viewer'] as UserRole[]).map(role => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-400">
                    <i className="ri-information-line mr-1"></i>
                    O usuário será aprovado e poderá acessar o sistema com o perfil selecionado.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedPendente(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-smooth cursor-pointer"
                  >
                    Aprovar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Criar Convite */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Gerar Link Compartilhável</h2>
                <button 
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteFormData({ expiresDays: 7, maxUses: 1 });
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateInvite(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Expira em (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inviteFormData.expiresDays}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, expiresDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="0 = sem expiração"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deixe em 0 para link sem expiração</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Máximo de usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inviteFormData.maxUses}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, maxUses: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número máximo de vezes que o link pode ser usado</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-400">
                    <i className="ri-information-line mr-1"></i>
                    O link gerado permitirá que pessoas se cadastrem no sistema. Após o cadastro, você precisará aprovar o usuário na aba "Usuários Pendentes".
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteFormData({ expiresDays: 7, maxUses: 1 });
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                  >
                    Gerar Link
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

