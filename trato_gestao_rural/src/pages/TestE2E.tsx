import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { addToQueue, syncQueue, getQueue, getPendingCount } from '@/lib/offline-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Database } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: string;
}

export default function TestE2E() {
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (name: string, status: TestResult['status'], message: string) => {
    setResults((prev) => [
      ...prev,
      {
        name,
        status,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const clearResults = () => setResults([]);

  const runTests = async () => {
    setTesting(true);
    clearResults();

    // Test 1: Verificar autenticação
    addResult('Auth Status', 'running', 'Verificando autenticação...');
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        addResult('Auth Status', 'success', `Usuário autenticado: ${authUser.email}`);
      } else {
        addResult('Auth Status', 'error', 'Nenhum usuário autenticado');
      }
    } catch (err) {
      addResult('Auth Status', 'error', `Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }

    // Test 2: Criar pesagem offline
    addResult('Offline Queue', 'running', 'Criando pesagem offline...');
    try {
      const pesagemData = {
        animal_id: 'test-animal-uuid',
        weight_kg: 450.5,
        weigh_date: new Date().toISOString().split('T')[0],
        method: 'balanca',
      };
      const record = addToQueue('pesagem', pesagemData);
      const queueCount = getPendingCount();
      addResult('Offline Queue', 'success', `Pesagem adicionada à fila. Pendentes: ${queueCount}`);
      console.log('[TestE2E] Pesagem offline criada:', record);
    } catch (err) {
      addResult('Offline Queue', 'error', `Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }

    // Test 3: Verificar localStorage
    addResult('LocalStorage', 'running', 'Verificando queue no localStorage...');
    try {
      const queue = getQueue();
      addResult('LocalStorage', 'success', `Queue localStorage: ${queue.length} registros`);
      console.log('[TestE2E] Queue no localStorage:', queue);
    } catch (err) {
      addResult('LocalStorage', 'error', `Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }

    // Test 4: Testar sincronização
    addResult('Sync RLS', 'running', 'Tentando sincronizar com Supabase...');
    try {
      const synced = await syncQueue();
      addResult('Sync RLS', 'success', `Sincronizados ${synced} registros com sucesso`);
      console.log('[TestE2E] Sincronização completada:', synced);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Desconhecido';
      addResult('Sync RLS', 'error', `Erro de sync: ${errorMsg}`);
      console.error('[TestE2E] Erro ao sincronizar:', err);
    }

    // Test 5: Verificar dados no Supabase
    addResult('Supabase RLS', 'running', 'Buscando dados de trato_weighings com RLS...');
    try {
      const { data, error } = await supabase.from('trato_weighings').select('*').limit(5);
      if (error) {
        addResult('Supabase RLS', 'error', `Erro RLS: ${error.message}`);
      } else {
        addResult('Supabase RLS', 'success', `Encontrados ${data?.length || 0} registros (RLS aplicado)`);
        if (data && data.length > 0) {
          console.log('[TestE2E] Amostra de dados:', data[0]);
        }
      }
    } catch (err) {
      addResult('Supabase RLS', 'error', `Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }

    setTesting(false);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">🧪 Testes E2E: Login → Offline → Sync</h1>
        <p className="text-gray-600">
          Validar fluxo completo com autenticação Supabase, offline-first e sincronização com RLS
        </p>
      </div>

      {/* Status de Autenticação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : user ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Status de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authLoading ? (
            <p className="text-gray-600">Carregando sessão...</p>
          ) : user ? (
            <div className="space-y-2">
              <p className="text-green-700 font-semibold">✅ Usuário autenticado</p>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-700 font-semibold">❌ Não autenticado</p>
              <p className="text-sm text-gray-600">
                Faça login em <a href="/login" className="text-blue-600 hover:underline">/login</a> para continuar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Testes */}
      <Button
        onClick={runTests}
        disabled={!user || testing || authLoading}
        className="w-full"
        size="lg"
      >
        {testing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Executando testes...
          </>
        ) : user ? (
          '▶️ Executar Testes E2E'
        ) : (
          '🔒 Faça login para testar'
        )}
      </Button>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Resultados dos Testes
            </CardTitle>
            <CardDescription>
              {results.filter((r) => r.status === 'success').length}/{results.length} testes passaram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border-l-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-500 text-green-900'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-500 text-red-900'
                      : 'bg-blue-50 border-blue-500 text-blue-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {result.status === 'success' && <CheckCircle2 className="h-4 w-4" />}
                        {result.status === 'error' && <XCircle className="h-4 w-4" />}
                        {result.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {result.status === 'pending' && <AlertCircle className="h-4 w-4" />}
                        {result.name}
                      </p>
                      <p className="text-sm mt-1">{result.message}</p>
                    </div>
                    <span className="text-xs opacity-70 whitespace-nowrap ml-2">{result.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instruções de Teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1️⃣ Login End-to-End</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Vá para <a href="/login" className="text-blue-600 hover:underline">/login</a></li>
              <li>Crie ou use uma conta Supabase (email + senha)</li>
              <li>Se tiver sucesso, você será redirecionado para aqui</li>
              <li>O status acima deve mostrar "✅ Usuário autenticado"</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2️⃣ Offline & Sync</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Clique em "Executar Testes E2E" acima</li>
              <li>Teste 1: Valida autenticação</li>
              <li>Teste 2: Cria pesagem offline em localStorage</li>
              <li>Teste 3: Verifica fila no localStorage</li>
              <li>Teste 4: Sincroniza com Supabase (com RLS automático)</li>
              <li>Teste 5: Busca dados em trato_weighings (apenas seus dados)</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3️⃣ Validar RLS</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Após os testes, abra o Supabase Console</li>
              <li>Vá para "SQL Editor" → "trato_weighings"</li>
              <li>Verifique que os dados sincronizados estão lá</li>
              <li>RLS garante que cada usuário vê apenas seus dados</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <p className="text-blue-900">
              <strong>💡 Dica:</strong> Abra o DevTools (F12) → Console para ver logs detalhados dos testes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
