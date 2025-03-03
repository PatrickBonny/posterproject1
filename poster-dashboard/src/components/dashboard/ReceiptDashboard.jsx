import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ReceiptDashboard = () => {
  const [data, setData] = useState({ transactions: [], summary: {} });
  const [expandedReceipt, setExpandedReceipt] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/transactions?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Звіт по ризиковим операціям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Всього чеків</p>
              <p className="text-xl font-bold">{data.summary.totalReceipts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Видалено після друку</p>
              <p className="text-xl font-bold">{data.summary.deletedAfterPrint}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Видалено при замовленні</p>
              <p className="text-xl font-bold">{data.summary.deletedDuringOrder}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Видалено після блоку</p>
              <p className="text-xl font-bold">{data.summary.deletedAfterBlock}</p>
            </div>
          </div>

          <div className="mt-6 h-[300px]">
            <LineChart
              width={800}
              height={300}
              data={data.transactions.map(t => ({
                date: new Date(t.openDate).toLocaleDateString(),
                count: 1
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" />
            </LineChart>
          </div>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Офіціант</TableCell>
                  <TableCell>Відкритий</TableCell>
                  <TableCell>Закритий</TableCell>
                  <TableCell>Заклад</TableCell>
                  <TableCell>Оплачено</TableCell>
                  <TableCell>Деталі</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map(receipt => (
                  <React.Fragment key={receipt.transactionId}>
                    <TableRow>
                      <TableCell>{receipt.transactionId}</TableCell>
                      <TableCell>{receipt.waiterName}</TableCell>
                      <TableCell>
                        {new Date(receipt.openDate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(receipt.closeDate).toLocaleString()}
                      </TableCell>
                      <TableCell>{receipt.spot}</TableCell>
                      <TableCell>{receipt.sum.toFixed(2)} €</TableCell>
                      <TableCell>
                        <button
                          className="text-blue-600 underline"
                          onClick={() => setExpandedReceipt(
                            expandedReceipt === receipt.transactionId ? null : receipt.transactionId
                          )}
                        >
                          Деталі
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedReceipt === receipt.transactionId && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="bg-gray-50 p-4 rounded">
                            {receipt.deletedItems.map((item, index) => (
                              <p key={index} className="py-1">
                                {new Date(item.deleteTime).toLocaleString()} - Видалено товар: {item.name}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptDashboard;