export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  petPreferido: string;
}

export interface Pet {
  id: string;
  clienteId: string;
  clienteNome: string;
  nome: string;
  raca: string;
  idade: number;
  porte: "Pequeno" | "Médio" | "Grande";
  foto: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: "Ração" | "Brinquedo" | "Acessório" | "Higiene";
  preco: number;
  estoque: number;
  foto: string;
}

export interface Servico {
  id: string;
  tipo: "Banho" | "Tosa" | "Vacina" | "Consulta" | "Cortar Unhas" | "Banho e Tosa";
  petId: string;
  petNome: string;
  clienteNome: string;
  data: string;
  hora: string;
  preco: number;
  status: "Agendado" | "Confirmado" | "Concluído" | "Cancelado";
}

export interface Venda {
  id: string;
  clienteNome: string;
  itens: string;
  total: number;
  data: string;
  tipo: "Produto" | "Serviço" | "Misto";
  status: "Pago" | "Pendente" | "Cancelado";
}

const nomes = ["João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Carlos Souza", "Juliana Lima", "Fernando Alves", "Camila Pereira", "Lucas Ribeiro", "Patrícia Gomes", "Rafael Martins", "Beatriz Rocha", "Thiago Ferreira", "Larissa Nascimento", "Bruno Cardoso", "Isabela Araújo", "Gustavo Mendes", "Mariana Barbosa", "Diego Correia", "Amanda Vieira"];

const racas = ["Vira-lata", "Shih Tzu", "Labrador", "Golden Retriever", "Poodle", "Bulldog Francês", "Pastor Alemão", "Pinscher", "Yorkshire", "Husky Siberiano", "Rottweiler", "Beagle"];

const petNomes = ["Rex", "Luna", "Thor", "Mel", "Bob", "Nina", "Max", "Bella", "Toby", "Lola", "Simba", "Pipoca", "Buddy", "Amora", "Zeus", "Flora", "Duke", "Mia", "Rocky", "Daisy"];

export const clientes: Cliente[] = nomes.map((nome, i) => ({
  id: `cli-${i + 1}`,
  nome,
  email: `${nome.toLowerCase().replace(/ /g, ".")}@email.com`,
  telefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
  endereco: `Rua ${["das Flores", "dos Pinheiros", "Augusta", "São Paulo", "Paulista", "da Consolação"][i % 6]}, ${Math.floor(100 + Math.random() * 900)}`,
  petPreferido: racas[i % racas.length],
}));

export const pets: Pet[] = petNomes.map((nome, i) => ({
  id: `pet-${i + 1}`,
  clienteId: `cli-${(i % 20) + 1}`,
  clienteNome: nomes[i % 20],
  nome,
  raca: racas[i % racas.length],
  idade: Math.floor(1 + Math.random() * 14),
  porte: (["Pequeno", "Médio", "Grande"] as const)[i % 3],
  foto: `https://placedog.net/300/300?id=${i + 1}`,
}));

export const produtos: Produto[] = [
  { id: "prod-1", nome: "Ração Royal Canin Mini", categoria: "Ração", preco: 189.90, estoque: 45, foto: "" },
  { id: "prod-2", nome: "Ração Golden Premium", categoria: "Ração", preco: 129.90, estoque: 30, foto: "" },
  { id: "prod-3", nome: "Ração Pedigree Adulto", categoria: "Ração", preco: 79.90, estoque: 60, foto: "" },
  { id: "prod-4", nome: "Bolinha de Borracha", categoria: "Brinquedo", preco: 19.90, estoque: 100, foto: "" },
  { id: "prod-5", nome: "Osso de Nylon", categoria: "Brinquedo", preco: 24.90, estoque: 80, foto: "" },
  { id: "prod-6", nome: "Corda Interativa", categoria: "Brinquedo", preco: 29.90, estoque: 55, foto: "" },
  { id: "prod-7", nome: "Coleira Ajustável P", categoria: "Acessório", preco: 34.90, estoque: 40, foto: "" },
  { id: "prod-8", nome: "Cama Pet Luxo M", categoria: "Acessório", preco: 149.90, estoque: 15, foto: "" },
  { id: "prod-9", nome: "Comedouro Inox", categoria: "Acessório", preco: 39.90, estoque: 70, foto: "" },
  { id: "prod-10", nome: "Shampoo Neutro 500ml", categoria: "Higiene", preco: 29.90, estoque: 90, foto: "" },
  { id: "prod-11", nome: "Condicionador Pet 300ml", categoria: "Higiene", preco: 24.90, estoque: 65, foto: "" },
  { id: "prod-12", nome: "Escova Desembaraçadora", categoria: "Higiene", preco: 22.90, estoque: 50, foto: "" },
  { id: "prod-13", nome: "Ração Whiskas Gato", categoria: "Ração", preco: 59.90, estoque: 5, foto: "" },
  { id: "prod-14", nome: "Arranhador para Gato", categoria: "Brinquedo", preco: 89.90, estoque: 3, foto: "" },
  { id: "prod-15", nome: "Guia Retrátil 5m", categoria: "Acessório", preco: 59.90, estoque: 25, foto: "" },
];

const hoje = new Date();
const formatDate = (d: Date) => d.toISOString().split("T")[0];

export const servicos: Servico[] = Array.from({ length: 20 }, (_, i) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + Math.floor(Math.random() * 7) - 1);
  const tipos = ["Banho", "Tosa", "Vacina", "Consulta", "Cortar Unhas", "Banho e Tosa"] as const;
  const tipo = tipos[i % 6];
  return {
    id: `srv-${i + 1}`,
    tipo,
    petId: `pet-${(i % 20) + 1}`,
    petNome: petNomes[i % 20],
    clienteNome: nomes[i % 20],
    data: formatDate(d),
    hora: `${9 + (i % 9)}:${i % 2 === 0 ? "00" : "30"}`,
    preco: tipo === "Banho" ? 60 : tipo === "Tosa" ? 80 : tipo === "Vacina" ? 120 : tipo === "Consulta" ? 150 : tipo === "Cortar Unhas" ? 30 : 120,
    status: (["Agendado", "Confirmado", "Concluído", "Cancelado"] as const)[i % 4],
  };
});

export const vendas: Venda[] = [
  { id: "v-1", clienteNome: "João Silva", itens: "Ração Royal Canin + Banho", total: 249.90, data: formatDate(hoje), tipo: "Misto", status: "Pago" },
  { id: "v-2", clienteNome: "Maria Santos", itens: "Coleira + Guia Retrátil", total: 94.80, data: formatDate(hoje), tipo: "Produto", status: "Pago" },
  { id: "v-3", clienteNome: "Pedro Oliveira", itens: "Tosa Completa", total: 80.00, data: formatDate(hoje), tipo: "Serviço", status: "Pendente" },
  { id: "v-4", clienteNome: "Ana Costa", itens: "Ração Golden + Shampoo", total: 159.80, data: formatDate(new Date(hoje.getTime() - 86400000)), tipo: "Produto", status: "Pago" },
  { id: "v-5", clienteNome: "Carlos Souza", itens: "Vacina V10", total: 120.00, data: formatDate(new Date(hoje.getTime() - 86400000)), tipo: "Serviço", status: "Pago" },
  { id: "v-6", clienteNome: "Juliana Lima", itens: "Cama Pet Luxo M", total: 149.90, data: formatDate(new Date(hoje.getTime() - 86400000)), tipo: "Produto", status: "Cancelado" },
  { id: "v-7", clienteNome: "Fernando Alves", itens: "Banho + Tosa", total: 140.00, data: formatDate(new Date(hoje.getTime() - 172800000)), tipo: "Serviço", status: "Pago" },
  { id: "v-8", clienteNome: "Camila Pereira", itens: "Ração Pedigree x3", total: 239.70, data: formatDate(new Date(hoje.getTime() - 172800000)), tipo: "Produto", status: "Pago" },
  { id: "v-9", clienteNome: "Lucas Ribeiro", itens: "Consulta Veterinária", total: 150.00, data: formatDate(new Date(hoje.getTime() - 259200000)), tipo: "Serviço", status: "Pendente" },
  { id: "v-10", clienteNome: "Patrícia Gomes", itens: "Kit Higiene Completo", total: 77.70, data: formatDate(new Date(hoje.getTime() - 259200000)), tipo: "Produto", status: "Pago" },
];

export const statsData = {
  vendasHoje: vendas.filter(v => v.data === formatDate(hoje)).reduce((s, v) => s + v.total, 0),
  totalVendasHoje: vendas.filter(v => v.data === formatDate(hoje)).length,
  agendamentosHoje: servicos.filter(s => s.data === formatDate(hoje)).length,
  estoqueBaixo: produtos.filter(p => p.estoque < 10).length,
  totalClientes: clientes.length,
  totalPets: pets.length,
};
