import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataItem {
  name: string;
  value: number;
}

interface Props {
  data: DataItem[];
  title?: string;
}

const COLORS = [
  'hsl(0, 84%, 55%)',
  'hsl(25, 95%, 53%)',
  'hsl(45, 93%, 47%)',
  'hsl(150, 60%, 40%)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(330, 70%, 50%)',
  'hsl(180, 50%, 45%)',
];

export function CategoryPieChart({ data, title = 'Distribuição por Categoria' }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              fontSize={11}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
