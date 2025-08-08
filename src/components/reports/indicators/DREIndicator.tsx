import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import supabase from '@/lib/supabaseClient';

const DREComparativo = () => {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      const { data, error } = await supabase
        .from('dre_j150')
        .select('company_name, year, account_description, value')
        .order('company_name', { ascending: true })
        .order('account_description', { ascending: true })
        .order('year', { ascending: true });

      if (error) {
        console.error('Erro ao buscar dados:', error);
      } else {
        setDados(data);
      }
      setCarregando(false);
    };

    carregarDados();
  }, []);

  const agruparDados = () => {
    const agrupado = {};
    const anosSet = new Set();

    dados.forEach((linha) => {
      const { company_name, account_description, year, value } = linha;
      anosSet.add(year);
      const chave = `${company_name}__${account_description}`;
      if (!agrupado[chave]) {
        agrupado[chave] = {
          company_name,
          account_description,
          valores: {}
        };
      }
      agrupado[chave].valores[year] = value;
    });

    const anos = Array.from(anosSet).sort();
    return { linhas: Object.values(agrupado), anos };
  };

  if (carregando) {
    return <Skeleton className="h-48 w-full" />;
  }

  const { linhas, anos } = agruparDados();

  return (
    <Card>
      <CardHeader>
        <CardTitle>DRE Comparativo por Conta</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Conta</TableHead>
              {anos.map((ano) => (
                <TableHead key={ano} className="text-right">{ano}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((linha, idx) => (
              <TableRow key={idx}>
                <TableCell>{linha.company_name}</TableCell>
                <TableCell>{linha.account_description}</TableCell>
                {anos.map((ano) => (
                  <TableCell key={ano} className="text-right">
                    {linha.valores[ano]?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }) || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DREComparativo;
