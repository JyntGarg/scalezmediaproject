import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { DollarSign, Plus, Edit, Trash2, Info } from "lucide-react";

const defaultExpense = {
  title: '',
  description: '',
  startTimeDays: 0,
  endTimeDays: 365,
  amountPerDay: 0,
  amountIncreasePer100CustomersPerDay: 0,
};

const FixedTab = ({ data = [], updateData }) => {
  const [editingExpense, setEditingExpense] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const openEditDialog = (expense = null, index = -1) => {
    setEditingExpense(expense ? { ...expense } : { ...defaultExpense });
    setSelectedIndex(index);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    const newExpenses = [...data];
    if (selectedIndex >= 0) {
      newExpenses[selectedIndex] = editingExpense;
    } else {
      newExpenses.push(editingExpense);
    }

    updateData(newExpenses);
    setIsDialogOpen(false);
    setEditingExpense(null);
    setSelectedIndex(-1);
  };

  const deleteExpense = (index) => {
    const newExpenses = data.filter((_, i) => i !== index);
    updateData(newExpenses);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Fixed Expenses</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => openEditDialog()}
                  className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Fixed Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedIndex >= 0 ? 'Edit Fixed Expense' : 'Create Fixed Expense'}
                  </DialogTitle>
                </DialogHeader>
                {editingExpense && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="title">Title</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="title"
                            value={editingExpense.title}
                            onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="description">Description</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="description"
                            value={editingExpense.description}
                            onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                            placeholder="Optional description of the expense"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Active Period</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="startTimeDays">Start Time (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="startTimeDays"
                            type="number"
                            value={editingExpense.startTimeDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingExpense({ ...editingExpense, startTimeDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="endTimeDays">End Time (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="endTimeDays"
                            type="number"
                            value={editingExpense.endTimeDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingExpense({ ...editingExpense, endTimeDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cost Structure */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Cost Structure</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="amountPerDay">Base Amount per Day ($)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="amountPerDay"
                            type="number"
                            step="0.01"
                            value={editingExpense.amountPerDay}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingExpense({ ...editingExpense, amountPerDay: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="amountIncreasePer100CustomersPerDay">Variable Increase per 100 Customers ($)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="amountIncreasePer100CustomersPerDay"
                            type="number"
                            step="0.01"
                            value={editingExpense.amountIncreasePer100CustomersPerDay}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingExpense({ ...editingExpense, amountIncreasePer100CustomersPerDay: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-black hover:bg-gray-800 text-white">Save</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fixed expenses configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Daily Amount</TableHead>
                  <TableHead>Variable Increase</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>Day {expense.startTimeDays} - {expense.endTimeDays}</TableCell>
                    <TableCell>${expense.amountPerDay}</TableCell>
                    <TableCell>${expense.amountIncreasePer100CustomersPerDay}/100 customers</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(expense, index)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteExpense(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedTab;