import { useState } from 'react';
import YouTubePreview from './YouTubePreview';
import FileUpload from './FileUpload';

interface ReferenciaFormProps {
  projetoId: string;
  faixaId?: string;
  onSave: (referencia: {
    tipo: 'youtube_url' | 'arquivo';
    url?: string;
    arquivo_url?: string;
    arquivo_nome?: string;
    titulo: string;
    descricao?: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    tipo: 'youtube_url' | 'arquivo';
    url?: string;
    arquivo_url?: string;
    arquivo_nome?: string;
    titulo?: string;
    descricao?: string;
  };
}

export default function ReferenciaForm({
  projetoId,
  faixaId,
  onSave,
  onCancel,
  initialData,
}: ReferenciaFormProps) {
  const [tipo, setTipo] = useState<'youtube_url' | 'arquivo'>(initialData?.tipo || 'youtube_url');
  const [url, setUrl] = useState(initialData?.url || '');
  const [arquivoUrl, setArquivoUrl] = useState(initialData?.arquivo_url || '');
  const [arquivoNome, setArquivoNome] = useState(initialData?.arquivo_nome || '');
  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      alert('Por favor, preencha o título da referência.');
      return;
    }

    if (tipo === 'youtube_url' && !url.trim()) {
      alert('Por favor, informe a URL do YouTube.');
      return;
    }

    if (tipo === 'arquivo' && !arquivoUrl) {
      alert('Por favor, faça o upload do arquivo.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        tipo,
        url: tipo === 'youtube_url' ? url : undefined,
        arquivo_url: tipo === 'arquivo' ? arquivoUrl : undefined,
        arquivo_nome: tipo === 'arquivo' ? arquivoNome : undefined,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
      });
    } catch (error) {
      console.error('Erro ao salvar referência:', error);
      alert('Erro ao salvar referência. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Referência</label>
        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value as 'youtube_url' | 'arquivo');
            setUrl('');
            setArquivoUrl('');
            setArquivoNome('');
          }}
          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
        >
          <option value="youtube_url">URL do YouTube</option>
          <option value="arquivo">Upload de Arquivo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
        <input
          type="text"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
          placeholder="Ex: Referência de vídeo clipe"
        />
      </div>

      {tipo === 'youtube_url' ? (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">URL do YouTube *</label>
          <input
            type="url"
            required={tipo === 'youtube_url'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {url && (
            <div className="mt-3">
              <YouTubePreview url={url} title={titulo || 'Preview'} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo *</label>
          {arquivoUrl ? (
            <div className="space-y-2">
              <div className="px-4 py-3 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="ri-file-line text-primary-teal text-xl"></i>
                  <div>
                    <p className="text-sm text-white">{arquivoNome}</p>
                    <a
                      href={arquivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-teal hover:text-primary-brown transition-smooth"
                    >
                      Ver arquivo
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setArquivoUrl('');
                    setArquivoNome('');
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 transition-smooth"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
            </div>
          ) : (
            <FileUpload
              bucket="projetos-referencias"
              folder={`projeto-${projetoId}${faixaId ? `/faixa-${faixaId}` : ''}`}
              onUploadComplete={(url, fileName) => {
                setArquivoUrl(url);
                setArquivoNome(fileName);
              }}
              onError={(error) => alert(`Erro: ${error}`)}
              accept="*/*"
              maxSizeMB={100}
              label="Selecionar arquivo"
            />
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
          placeholder="Descrição opcional da referência..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando...' : 'Salvar Referência'}
        </button>
      </div>
    </form>
  );
}
