import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { UserRole } from '../../contexts/AuthContext';

type TabType = 'usuarios' | 'configuracoes';

export default function Configuracoes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('usuarios');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos');

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
    }
  }, [isAdmin]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
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
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 ${
                activeTab === 'usuarios'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <i className="ri-user-line"></i>
              <span>Gerenciar Usuários</span>
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
                        <p className="text-xs text-gray-400">Integração com YouTube API</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs rounded-lg bg-green-500/20 text-green-400">
                      Conectado
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
      </div>
    </MainLayout>
  );
}

