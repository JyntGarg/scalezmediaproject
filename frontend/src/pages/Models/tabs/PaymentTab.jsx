import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard,
  Info
} from "lucide-react";

const PaymentTab = ({ data = [], updateData }) => {
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const defaultSchedule = {
    title: '',
    offerId: 'all',
    amount: 0,
    costToFulfillPct: 0,
    probability: 1,
    startTimeDays: 0,
    transactionFeePct: 0,
    costPerSalePct: 0,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingSchedule) return;

    const newSchedules = [...data];
    if (selectedIndex >= 0) {
      newSchedules[selectedIndex] = editingSchedule;
    } else {
      newSchedules.push(editingSchedule);
    }

    updateData(newSchedules);
    setIsDialogOpen(false);
    setEditingSchedule(null);
    setSelectedIndex(-1);
  };

  const deleteSchedule = (index) => {
    const newSchedules = data.filter((_, i) => i !== index);
    updateData(newSchedules);
  };

  const openEditDialog = (schedule, index) => {
    setEditingSchedule(schedule || defaultSchedule);
    setSelectedIndex(index ?? -1);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Payment Schedule Management</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => openEditDialog()}
                  className="bg-black hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedIndex >= 0 ? 'Edit Payment Schedule' : 'Create Payment Schedule'}
                  </DialogTitle>
                </DialogHeader>
                {editingSchedule && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="title">Title</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="title"
                          value={editingSchedule.title}
                          onChange={(e) => setEditingSchedule({ ...editingSchedule, title: e.target.value })}
                          placeholder="e.g., Up Front Fee"
                          required
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="offerId">Target Offer</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Select 
                          value={editingSchedule.offerId} 
                          onValueChange={(value) => setEditingSchedule({ ...editingSchedule, offerId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target offer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Offers</SelectItem>
                            <SelectItem value="offer1">Enterprise SaaS</SelectItem>
                            <SelectItem value="offer2">SMB Package</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="amount">Amount</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={editingSchedule.amount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingSchedule({ ...editingSchedule, amount: isNaN(value) ? 0 : value });
                          }}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="probability">Probability (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="probability"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingSchedule.probability * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingSchedule({ ...editingSchedule, probability: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="startTimeDays">Start Time (Days)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="startTimeDays"
                          type="number"
                          value={editingSchedule.startTimeDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingSchedule({ ...editingSchedule, startTimeDays: isNaN(value) ? 0 : value });
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="costToFulfillPct">Cost to Fulfill (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="costToFulfillPct"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingSchedule.costToFulfillPct * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingSchedule({ ...editingSchedule, costToFulfillPct: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="transactionFeePct">Transaction Fee (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="transactionFeePct"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingSchedule.transactionFeePct * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingSchedule({ ...editingSchedule, transactionFeePct: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="costPerSalePct">Cost Per Sale (%)</Label>
                          <div className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </div>
                        <Input
                          id="costPerSalePct"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingSchedule.costPerSalePct * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingSchedule({ ...editingSchedule, costPerSalePct: isNaN(value) ? 0 : value / 100 });
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Calculated Values</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Net Amount:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(editingSchedule.amount * editingSchedule.probability)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Costs:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(editingSchedule.amount * (editingSchedule.costToFulfillPct + editingSchedule.transactionFeePct + editingSchedule.costPerSalePct))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-black hover:bg-gray-800">Save Schedule</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Payment Schedules</h3>
              <p className="text-muted-foreground">Create payment schedules to define custom billing arrangements.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Net Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((schedule, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{schedule.title}</TableCell>
                    <TableCell>{formatCurrency(schedule.amount)}</TableCell>
                    <TableCell>{(schedule.probability * 100).toFixed(1)}%</TableCell>
                    <TableCell>Day {schedule.startTimeDays}</TableCell>
                    <TableCell>
                      {formatCurrency(schedule.amount * schedule.probability *
                         (1 - schedule.costToFulfillPct - schedule.transactionFeePct - schedule.costPerSalePct))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(schedule, index)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSchedule(index)}
                        >
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

export default PaymentTab;