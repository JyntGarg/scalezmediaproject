import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { BarChart3, Plus, Edit, Trash2, Info } from "lucide-react";

const defaultEvent = {
  title: '',
  description: '',
  timeDays: 0,
  amount: 0,
  type: 'Equity',
  terms: '',
  interestRatePct: 0,
  maturityTimeDays: 365,
  paybackPeriodDays: 30,
  compoundingPeriodDays: 30,
  valuation: 0,
  sharesIssued: 0,
  grantPurpose: '',
};

const FinancingTab = ({ data = [], updateData }) => {
  const [editingEvent, setEditingEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const openEditDialog = (event = null, index = -1) => {
    setEditingEvent(event ? { ...event } : { ...defaultEvent });
    setSelectedIndex(index);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    const newEvents = [...data];
    if (selectedIndex >= 0) {
      newEvents[selectedIndex] = editingEvent;
    } else {
      newEvents.push(editingEvent);
    }

    updateData(newEvents);
    setIsDialogOpen(false);
    setEditingEvent(null);
    setSelectedIndex(-1);
  };

  const deleteEvent = (index) => {
    const newEvents = data.filter((_, i) => i !== index);
    updateData(newEvents);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Financing</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openEditDialog()} className="bg-black hover:bg-gray-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Financing Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedIndex >= 0 ? 'Edit Financing Event' : 'Create Financing Event'}
                  </DialogTitle>
                </DialogHeader>
                {editingEvent && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="title">Title</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="title"
                            value={editingEvent.title}
                            onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="type">Financing Type</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Select value={editingEvent.type} onValueChange={(value) => setEditingEvent({ ...editingEvent, type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select financing type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Equity">Equity</SelectItem>
                              <SelectItem value="Grant">Grant</SelectItem>
                              <SelectItem value="Loan">Loan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="description">Description</Label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Input
                          id="description"
                          value={editingEvent.description}
                          onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                          placeholder="Optional description of the financing event"
                        />
                      </div>
                    </div>

                    {/* Amount & Timing */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Amount & Timing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={editingEvent.amount}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingEvent({ ...editingEvent, amount: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="timeDays">Event Time (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="timeDays"
                            type="number"
                            value={editingEvent.timeDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, timeDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="terms">General Terms</Label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Input
                          id="terms"
                          value={editingEvent.terms}
                          onChange={(e) => setEditingEvent({ ...editingEvent, terms: e.target.value })}
                          placeholder="Enter general terms and conditions"
                        />
                      </div>
                    </div>

                    {/* Type-specific fields */}
                    {editingEvent.type === 'Loan' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Loan Terms</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor="interestRatePct">Interest Rate (%)</Label>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <Input
                              id="interestRatePct"
                              type="number"
                              step="0.01"
                              value={editingEvent.interestRatePct}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                setEditingEvent({ ...editingEvent, interestRatePct: isNaN(value) ? 0 : value });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor="maturityTimeDays">Maturity Period (Days)</Label>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <Input
                              id="maturityTimeDays"
                              type="number"
                              value={editingEvent.maturityTimeDays}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setEditingEvent({ ...editingEvent, maturityTimeDays: isNaN(value) ? 0 : value });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor="paybackPeriodDays">Payback Period (Days)</Label>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <Input
                              id="paybackPeriodDays"
                              type="number"
                              value={editingEvent.paybackPeriodDays}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setEditingEvent({ ...editingEvent, paybackPeriodDays: isNaN(value) ? 0 : value });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor="compoundingPeriodDays">Compounding Period (Days)</Label>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <Input
                              id="compoundingPeriodDays"
                              type="number"
                              value={editingEvent.compoundingPeriodDays}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setEditingEvent({ ...editingEvent, compoundingPeriodDays: isNaN(value) ? 0 : value });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {editingEvent.type === 'Equity' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Equity Terms</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor="valuation">Pre-Money Valuation ($)</Label>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <Input
                              id="valuation"
                              type="number"
                              step="0.01"
                              value={editingEvent.valuation}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                setEditingEvent({ ...editingEvent, valuation: isNaN(value) ? 0 : value });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor="sharesIssued">Shares Issued</Label>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <Input
                              id="sharesIssued"
                              type="number"
                              value={editingEvent.sharesIssued}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setEditingEvent({ ...editingEvent, sharesIssued: isNaN(value) ? 0 : value });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {editingEvent.type === 'Grant' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Grant Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="grantPurpose">Grant Purpose</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="grantPurpose"
                            value={editingEvent.grantPurpose}
                            onChange={(e) => setEditingEvent({ ...editingEvent, grantPurpose: e.target.value })}
                            placeholder="Specify the intended use of grant funds"
                          />
                        </div>
                      </div>
                    )}

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
            <p className="text-muted-foreground text-center py-8">No financing events configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>
                      <Badge className={event.type === 'Equity' ? 'bg-black hover:bg-gray-800 text-white' : ''} variant={event.type === 'Equity' ? undefined : event.type === 'Grant' ? 'secondary' : 'outline'}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell>${event.amount.toLocaleString()}</TableCell>
                    <TableCell>Day {event.timeDays}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                      {event.type === 'Loan' && event.interestRatePct > 0 ? `${event.interestRatePct}% APR` :
                       event.type === 'Equity' && event.valuation > 0 ? `$${(event.valuation / 1000000).toFixed(1)}M pre` :
                       event.terms || 'No terms'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(event, index)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteEvent(index)}>
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

export default FinancingTab;