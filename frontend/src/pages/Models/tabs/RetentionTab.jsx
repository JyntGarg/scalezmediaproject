import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Users, Plus, Edit, Trash2, Info } from "lucide-react";

const channels = [
  'Email Marketing',
  'Push Notifications',
  'SMS Marketing',
  'Loyalty Program',
  'Customer Success',
  'Account Management',
  'Product Updates',
  'Newsletters',
  'Other',
];

const defaultEvent = {
  title: '',
  offerId: '',
  channel: 'Email Marketing',
  startTimeDays: 30,
  endTimeDays: 365,
  returningCustomerRate: 0.2,
  costToMarketReturnPct: 0.05,
  timeToReturnDays: 90,
  timeToCollectDays: 1,
  validated: '',
  validationData: '',
};

const RetentionTab = ({ data = [], updateData }) => {
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
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Customer Retention Events</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => openEditDialog()}
                  className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Retention Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedIndex >= 0 ? 'Edit Retention Event' : 'Create Retention Event'}
                  </DialogTitle>
                </DialogHeader>
                {editingEvent && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="title">Title</Label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Input
                          id="title"
                          value={editingEvent.title}
                          onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                          placeholder="e.g., Quarterly Renewal Campaign"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="offer">Offer</Label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Select value={editingEvent.offerId} onValueChange={(value) => setEditingEvent({ ...editingEvent, offerId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Offer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Offer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="channel">Channel</Label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Select
                          value={editingEvent.channel}
                          onValueChange={(value) => setEditingEvent({ ...editingEvent, channel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {channels.map((channel) => (
                              <SelectItem key={channel} value={channel}>
                                {channel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="startTimeDays">Start Time (Days)</Label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Input
                          id="startTimeDays"
                          type="number"
                          value={editingEvent.startTimeDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, startTimeDays: isNaN(value) ? 0 : value });
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
                          value={editingEvent.endTimeDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEditingEvent({ ...editingEvent, endTimeDays: isNaN(value) ? 0 : value });
                          }}
                        />
                      </div>
                    </div>

                    {/* Retention Metrics */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Retention Parameters</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="returningCustomerRate">Returning Customer Rate</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="returningCustomerRate"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editingEvent.returningCustomerRate * 100}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingEvent({ ...editingEvent, returningCustomerRate: isNaN(value) ? 0 : value / 100 });
                            }}
                            placeholder="20"
                          />
                          <p className="text-xs text-muted-foreground">As percentage (e.g., 20 for 20%)</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="costToMarketReturnPct">Cost to Market Return (%)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="costToMarketReturnPct"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editingEvent.costToMarketReturnPct * 100}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setEditingEvent({ ...editingEvent, costToMarketReturnPct: isNaN(value) ? 0 : value / 100 });
                            }}
                            placeholder="5"
                          />
                          <p className="text-xs text-muted-foreground">As percentage (e.g., 5 for 5%)</p>
                        </div>
                      </div>
                    </div>

                    {/* Cycle Timing */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Cycle Timing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="timeToReturnDays">Time to Return (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="timeToReturnDays"
                            type="number"
                            value={editingEvent.timeToReturnDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, timeToReturnDays: isNaN(value) ? 0 : value });
                            }}
                            placeholder="90"
                          />
                          <p className="text-xs text-muted-foreground">Repeat purchase cycle length</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="timeToCollectDays">Time to Collect (Days)</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Input
                            id="timeToCollectDays"
                            type="number"
                            value={editingEvent.timeToCollectDays}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setEditingEvent({ ...editingEvent, timeToCollectDays: isNaN(value) ? 0 : value });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Validation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Validation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="validated">Validation Status</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Select
                            value={editingEvent.validated === "Validated" ? "validated" : "not_validated"}
                            onValueChange={(value) => setEditingEvent({ ...editingEvent, validated: value === "validated" ? "Validated" : "" })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_validated">Not Validated</SelectItem>
                              <SelectItem value="validated">Validated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="validationData">Validation Data</Label>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <Textarea
                            id="validationData"
                            value={editingEvent.validationData}
                            onChange={(e) => setEditingEvent({ ...editingEvent, validationData: e.target.value })}
                            placeholder="Supporting data or notes"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Retention Model Overview</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Return Frequency:</span>
                          <span className="ml-2 font-medium">
                            Every {editingEvent.timeToReturnDays} days
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expected Return Rate:</span>
                          <span className="ml-2 font-medium">
                            {(editingEvent.returningCustomerRate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Marketing Cost:</span>
                          <span className="ml-2 font-medium">
                            {(editingEvent.costToMarketReturnPct * 100).toFixed(1)}% of revenue
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net Retention:</span>
                          <span className="ml-2 font-medium">
                            {((editingEvent.returningCustomerRate * (1 - editingEvent.costToMarketReturnPct)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-black hover:bg-gray-800 text-white">Save Event</Button>
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Retention Events</h3>
              <p className="text-muted-foreground">Create retention campaigns to improve customer lifetime value.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Return Rate</TableHead>
                  <TableHead>Return Cycle</TableHead>
                  <TableHead>Marketing Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.channel}</TableCell>
                    <TableCell>Days {event.startTimeDays}-{event.endTimeDays}</TableCell>
                    <TableCell>{(event.returningCustomerRate * 100).toFixed(1)}%</TableCell>
                    <TableCell>Every {event.timeToReturnDays} days</TableCell>
                    <TableCell>{(event.costToMarketReturnPct * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      {event.validated === 'Validated' ? (
                        <Badge className="bg-black hover:bg-gray-800 text-white">Validated</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEvent(index)}
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

export default RetentionTab;